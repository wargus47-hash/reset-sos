import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Alert, LayoutAnimation,
  UIManager, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSessions, getLibrary, removeFromLibrary, clearJournal, deleteSession } from '../storage/journal';
import { Colors } from '../theme/colors';

// Active LayoutAnimation sur Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MODE_LABELS = {
  sos:       { label: 'SOS',         color: Colors.pink },
  calm:      { label: 'Guidé',       color: Colors.turquoise },
  companion: { label: 'Accomp.',     color: Colors.purple },
  night:     { label: 'Nuit',        color: '#002FA7' },
  discreet:  { label: 'Discret',     color: Colors.gray },
};

const MODE_FULL = {
  sos:       'Mode SOS',
  calm:      'Mode guidé',
  companion: 'Mode accompagnateur',
  night:     'Mode nuit',
  discreet:  'Mode discret',
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(sec) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} min${s > 0 ? ' ' + s + 's' : ''}` : `${s}s`;
}

// ── Barre de score ─────────────────────────────────────────────────────────────
function ScoreBar({ value, color, label }) {
  const pct = Math.round(((value ?? 0) / 10) * 100);
  return (
    <View style={barStyles.wrap}>
      <View style={barStyles.labelRow}>
        <Text style={barStyles.label}>{label}</Text>
        <Text style={[barStyles.value, { color }]}>{value ?? '?'} / 10</Text>
      </View>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap:     { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label:    { fontSize: 10, color: Colors.gray, letterSpacing: 1, fontWeight: '600' },
  value:    { fontSize: 12, fontWeight: '700' },
  track:    { height: 6, borderRadius: 3, backgroundColor: 'rgba(253,250,244,0.08)', overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: 3 },
});

// ── Carte de séance ───────────────────────────────────────────────────────────
function SessionCard({ s, expanded, onToggle, onDelete }) {
  const m    = MODE_LABELS[s.mode] || MODE_LABELS.sos;
  const drop = (s.beforeScore ?? 0) - (s.afterScore ?? 0);
  const dropPct = s.beforeScore > 0
    ? Math.round((drop / s.beforeScore) * 100)
    : 0;
  const duration = formatDuration(s.durationSec);

  return (
    <TouchableOpacity
      style={[styles.sessionCard, expanded && styles.sessionCardOpen]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      {/* ── Ligne de résumé (toujours visible) ── */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.modeBadge, { borderColor: m.color + '55', backgroundColor: m.color + '18' }]}>
            <Text style={[styles.modeBadgeText, { color: m.color }]}>{m.label}</Text>
          </View>
          <View style={styles.cardHeaderText}>
            {s.label
              ? <Text style={styles.sessionLabel} numberOfLines={expanded ? 0 : 1}>{s.label}</Text>
              : <Text style={styles.sessionLabelEmpty}>Sans titre</Text>
            }
            <Text style={styles.sessionDate}>{formatDateShort(s.date)}</Text>
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          {drop > 0 && (
            <Text style={styles.dropBadge}>↓{drop}</Text>
          )}
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </View>

      {/* ── Contenu détaillé (visible si expanded) ── */}
      {expanded && (
        <View style={styles.cardBody}>

          {/* Date complète + mode + durée */}
          <View style={styles.metaBlock}>
            <Text style={styles.metaLine}>📅 {formatDate(s.date)}</Text>
            <Text style={styles.metaLine}>🎯 {MODE_FULL[s.mode] || 'Mode SOS'}</Text>
            {duration && <Text style={styles.metaLine}>⏱ {duration}</Text>}
          </View>

          <View style={styles.separator} />

          {/* Scores avec barres visuelles */}
          <View style={styles.scoresBlock}>
            <ScoreBar value={s.beforeScore} color={Colors.pink}     label="INTENSITÉ AVANT" />
            <ScoreBar value={s.afterScore}  color={Colors.turquoise} label="INTENSITÉ APRÈS" />

            {drop > 0 ? (
              <View style={styles.dropRow}>
                <Text style={styles.dropIcon}>↓</Text>
                <Text style={styles.dropText}>
                  Réduction de{' '}
                  <Text style={styles.dropHighlight}>{drop} point{drop > 1 ? 's' : ''}</Text>
                  {dropPct > 0 && <Text style={styles.dropPct}> ({dropPct}%)</Text>}
                </Text>
                {dropPct >= 50 && <Text style={styles.libBadge}>🔓 Libération</Text>}
              </View>
            ) : drop < 0 ? (
              <View style={[styles.dropRow, { borderColor: 'rgba(218,142,69,0.2)', backgroundColor: 'rgba(218,142,69,0.06)' }]}>
                <Text style={[styles.dropIcon, { color: Colors.pink }]}>↑</Text>
                <Text style={styles.dropText}>Intensité en hausse — normal, le corps traite</Text>
              </View>
            ) : null}
          </View>

          {/* Notes */}
          {s.notes ? (
            <>
              <View style={styles.separator} />
              <View style={styles.notesBlock}>
                <Text style={styles.notesLabel}>NOTES</Text>
                <Text style={styles.notesText}>{s.notes}</Text>
              </View>
            </>
          ) : null}

          {/* Bouton supprimer */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteBtnText}>Supprimer cette séance</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function JournalScreen({ navigation }) {
  const [tab,        setTab]        = useState('journal');
  const [sessions,   setSessions]   = useState([]);
  const [library,    setLibrary]    = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    setSessions(await getSessions());
    setLibrary(await getLibrary());
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const toggle = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  const confirmDelete = (id, label) =>
    Alert.alert(
      'Supprimer la séance ?',
      label || 'Cette séance sera définitivement supprimée.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            await deleteSession(id);
            setExpandedId(null);
            load();
          },
        },
      ]
    );

  const confirmClear = () =>
    Alert.alert('Effacer le journal', 'Toutes les séances seront supprimées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: async () => { await clearJournal(); load(); } },
    ]);

  // Stats
  const totalDrop = sessions.reduce((acc, s) => acc + ((s.beforeScore ?? 0) - (s.afterScore ?? 0)), 0);
  const avgDrop   = sessions.length ? Math.round(totalDrop / sessions.length) : 0;
  const liberations = sessions.filter(s => ((s.beforeScore ?? 0) - (s.afterScore ?? 0)) >= 5).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

      {/* Topbar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>
        {tab === 'journal' && sessions.length > 0 && (
          <TouchableOpacity onPress={confirmClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearBtn}>Tout effacer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Onglets */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'journal' && styles.tabActive]}
          onPress={() => setTab('journal')}
        >
          <Text style={[styles.tabText, tab === 'journal' && styles.tabTextActive]}>
            Journal ({sessions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'library' && styles.tabActive]}
          onPress={() => setTab('library')}
        >
          <Text style={[styles.tabText, tab === 'library' && styles.tabTextActive]}>
            Perturbations ({library.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ══ JOURNAL ══ */}
        {tab === 'journal' && (
          <>
            {sessions.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📓</Text>
                <Text style={styles.emptyText}>Aucune séance enregistrée.</Text>
                <Text style={styles.emptySubtext}>Lance une session SOS pour commencer.</Text>
              </View>
            ) : (
              <>
                {/* Stats globales */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNum}>{sessions.length}</Text>
                    <Text style={styles.statLabel}>séances</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statNum, { color: Colors.turquoise }]}>
                      {avgDrop > 0 ? `−${avgDrop}` : '—'}
                    </Text>
                    <Text style={styles.statLabel}>pts moy.</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statNum, { color: Colors.pink }]}>{liberations}</Text>
                    <Text style={styles.statLabel}>libérations</Text>
                  </View>
                </View>

                <Text style={styles.hint}>Appuie sur une séance pour la consulter</Text>

                {sessions.map(s => (
                  <SessionCard
                    key={s.id}
                    s={s}
                    expanded={expandedId === s.id}
                    onToggle={() => toggle(s.id)}
                    onDelete={() => confirmDelete(s.id, s.label)}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* ══ BIBLIOTHÈQUE ══ */}
        {tab === 'library' && (
          <>
            {library.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyText}>Aucune perturbation sauvegardée.</Text>
                <Text style={styles.emptySubtext}>
                  Nomme ta perturbation à la fin d'une session pour la retrouver ici.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.hint}>
                  {library.length} perturbation{library.length > 1 ? 's' : ''} suivie{library.length > 1 ? 's' : ''}
                </Text>
                {library.map(item => (
                  <View key={item.id} style={styles.libraryItem}>
                    <View style={styles.libraryLeft}>
                      <View style={styles.libraryTitleRow}>
                        <Text style={styles.libraryName}>{item.name}</Text>
                        <View style={[
                          styles.countBadge,
                          item.count >= 3
                            ? { backgroundColor: 'rgba(218,142,69,0.15)', borderColor: 'rgba(218,142,69,0.4)' }
                            : { backgroundColor: 'rgba(253,250,244,0.06)', borderColor: 'rgba(253,250,244,0.12)' },
                        ]}>
                          <Text style={[
                            styles.countText,
                            { color: item.count >= 3 ? Colors.pink : Colors.gray },
                          ]}>
                            ×{item.count}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.libraryMeta}>
                        Dernière séance · {formatDateShort(item.lastUsed)}
                      </Text>
                      {item.count >= 3 && (
                        <Text style={styles.libraryWarning}>
                          ⚡ Revient souvent — un praticien peut t'aider à aller plus loin
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Supprimer ?', item.name, [
                        { text: 'Annuler', style: 'cancel' },
                        {
                          text: 'Supprimer', style: 'destructive',
                          onPress: () => { removeFromLibrary(item.id); load(); },
                        },
                      ])}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deleteX}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.darkBlue },

  // ── Topbar ──
  topBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 0 },
  backBtn:  { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(253,250,244,0.07)', borderWidth: 1, borderColor: 'rgba(253,250,244,0.12)' },
  backText: { color: 'rgba(253,250,244,0.55)', fontSize: 13, fontWeight: '600' },
  clearBtn: { color: Colors.pink, fontSize: 12, fontWeight: '600' },

  // ── Onglets ──
  tabs:         { flexDirection: 'row', marginHorizontal: 24, marginTop: 16, gap: 8 },
  tab:          { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(253,250,244,0.08)', alignItems: 'center' },
  tabActive:    { backgroundColor: 'rgba(1,219,238,0.1)', borderColor: Colors.turquoise },
  tabText:      { color: Colors.gray, fontSize: 12, fontWeight: '600' },
  tabTextActive:{ color: Colors.turquoise },

  // ── Corps ──
  body:  { padding: 24, gap: 10, paddingBottom: 48 },
  hint:  { color: 'rgba(253,250,244,0.2)', fontSize: 11, textAlign: 'center', marginBottom: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon:    { fontSize: 48 },
  emptyText:    { color: Colors.white, fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: Colors.gray, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // ── Stats ──
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  statBox:  { flex: 1, backgroundColor: 'rgba(253,250,244,0.05)', borderRadius: 12, padding: 14, alignItems: 'center' },
  statNum:  { fontSize: 24, fontWeight: '700', color: Colors.white },
  statLabel:{ fontSize: 10, color: Colors.gray, marginTop: 2, letterSpacing: 1 },

  // ── Carte séance ──
  sessionCard: {
    backgroundColor: 'rgba(253,250,244,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(253,250,244,0.08)',
    overflow: 'hidden',
  },
  sessionCardOpen: {
    borderColor: 'rgba(1,219,238,0.25)',
    backgroundColor: 'rgba(1,219,238,0.03)',
  },

  // En-tête de carte
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 10,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardHeaderText: { flex: 1, gap: 3 },
  cardHeaderRight:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  modeBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  modeBadgeText:  { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  sessionLabel:   { color: Colors.white, fontSize: 13, fontWeight: '600' },
  sessionLabelEmpty:{ color: 'rgba(253,250,244,0.25)', fontSize: 12, fontStyle: 'italic' },
  sessionDate:    { color: Colors.gray, fontSize: 11 },
  dropBadge:      { color: Colors.turquoise, fontSize: 12, fontWeight: '700' },
  chevron:        { color: 'rgba(253,250,244,0.25)', fontSize: 10 },

  // Corps déplié
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 14,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(253,250,244,0.06)',
  },

  // Métadonnées
  metaBlock: { gap: 6 },
  metaLine:  { color: 'rgba(253,250,244,0.5)', fontSize: 12, lineHeight: 18 },

  // Scores
  scoresBlock: { gap: 12 },
  dropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: 'rgba(1,219,238,0.07)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(1,219,238,0.18)',
    flexWrap: 'wrap',
  },
  dropIcon:      { fontSize: 16, color: Colors.turquoise, fontWeight: '700' },
  dropText:      { color: 'rgba(253,250,244,0.7)', fontSize: 12, flex: 1 },
  dropHighlight: { color: Colors.turquoise, fontWeight: '700' },
  dropPct:       { color: Colors.turquoise },
  libBadge:      { fontSize: 12 },

  // Notes
  notesBlock: { gap: 6 },
  notesLabel: { fontSize: 10, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  notesText:  { color: 'rgba(253,250,244,0.7)', fontSize: 13, lineHeight: 21 },

  // Supprimer
  deleteBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(253,250,244,0.05)',
    marginTop: 2,
  },
  deleteBtnText: { color: 'rgba(218,142,69,0.5)', fontSize: 12, fontWeight: '600' },

  // ── Bibliothèque ──
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(253,250,244,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(253,250,244,0.08)',
    padding: 14,
    gap: 10,
  },
  libraryLeft:     { flex: 1, gap: 5 },
  libraryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  libraryName:     { color: Colors.white, fontSize: 14, fontWeight: '600', flex: 1 },
  countBadge:      { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  countText:       { fontSize: 11, fontWeight: '700' },
  libraryMeta:     { color: Colors.gray, fontSize: 11 },
  libraryWarning:  { color: Colors.pink, fontSize: 11, lineHeight: 16 },
  deleteX:         { color: 'rgba(253,250,244,0.25)', fontSize: 16, padding: 4, marginTop: 2 },
});
