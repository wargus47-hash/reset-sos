import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, TextInput, Alert, Linking,
  Animated, LayoutAnimation, UIManager, Platform, KeyboardAvoidingView,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics        from 'expo-haptics';
import { useFocusEffect }  from '@react-navigation/native';
import { Colors }          from '../theme/colors';
import {
  getClients, saveClient, updateClient, deleteClient,
  getSessions, savePractitionerSession, deletePractitionerSession,
  markFollowUpDone, followUpDateFor,
} from '../storage/practitioner';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Notifications ─────────────────────────────────────────────────────────────
async function scheduleFollowUp(clientName, sessionDate) {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;
    const triggerDate = new Date(followUpDateFor(sessionDate));
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title:     '📞 Suivi client RESET',
        body:      `Il est temps de reprendre contact avec ${clientName} — 10 jours se sont écoulés.`,
        data:      { clientName },
        ...(Platform.OS === 'android' && { channelId: 'reset-followup' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
    return id;
  } catch (_) { return null; }
}

async function cancelFollowUp(notifId) {
  if (!notifId) return;
  try { await Notifications.cancelScheduledNotificationAsync(notifId); } catch (_) {}
}

// ── Formatage ─────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function daysUntil(iso) {
  if (!iso) return null;
  const diff = new Date(iso) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function daysAgo(iso) {
  if (!iso) return null;
  const diff = new Date() - new Date(iso);
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (d === 0) return "aujourd'hui";
  if (d === 1) return 'hier';
  return `il y a ${d} j`;
}

// ── Composant : barre de score ────────────────────────────────────────────────
function MiniScore({ before, after }) {
  if (!before && !after) return null;
  const drop = (before ?? 0) - (after ?? 0);
  return (
    <View style={sc.row}>
      <Text style={sc.before}>{before ?? '?'}</Text>
      <Text style={sc.arrow}>→</Text>
      <Text style={sc.after}>{after ?? '?'}</Text>
      {drop > 0 && <Text style={sc.drop}>↓{drop}</Text>}
    </View>
  );
}
const sc = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  before: { color: Colors.pink, fontSize: 13, fontWeight: '700' },
  arrow:  { color: Colors.gray, fontSize: 11 },
  after:  { color: Colors.turquoise, fontSize: 13, fontWeight: '700' },
  drop:   { color: Colors.turquoise, fontSize: 11, fontWeight: '700',
            backgroundColor: 'rgba(14,224,229,0.12)', paddingHorizontal: 5,
            paddingVertical: 1, borderRadius: 5 },
});

// ── Composant : sélecteur de score 1-10 ──────────────────────────────────────
function ScorePicker({ value, onChange, color }) {
  return (
    <View style={sp.row}>
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <TouchableOpacity
          key={n}
          style={[sp.dot, { backgroundColor: value >= n ? color : 'rgba(255,255,255,0.08)' }]}
          onPress={() => onChange(n)}
          hitSlop={{ top: 6, bottom: 6 }}
        />
      ))}
    </View>
  );
}
const sp = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5 },
  dot: { flex: 1, height: 10, borderRadius: 5 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// VUE : FORMULAIRE CLIENT
// ═══════════════════════════════════════════════════════════════════════════════
function ClientForm({ initial, onSave, onCancel }) {
  const [name,  setName]  = useState(initial?.name  || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  const valid = name.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.formTitle}>{initial ? 'Modifier le client' : 'Nouveau client'}</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NOM / PRÉNOM *</Text>
          <TextInput style={styles.input} placeholder="ex : Marie D." placeholderTextColor={ph}
            value={name} onChangeText={setName} autoCapitalize="words" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>TÉLÉPHONE</Text>
          <TextInput style={styles.input} placeholder="06 XX XX XX XX" placeholderTextColor={ph}
            value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <TextInput style={styles.input} placeholder="adresse@email.com" placeholderTextColor={ph}
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NOTES GÉNÉRALES</Text>
          <TextInput style={[styles.input, styles.tall]} placeholder="Contexte, historique, points d'attention…"
            placeholderTextColor={ph} value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !valid && { opacity: 0.4 }]}
          onPress={() => valid && onSave({ name: name.trim(), phone: phone.trim(), email: email.trim(), notes: notes.trim() })}
          disabled={!valid}
        >
          <Text style={styles.primaryBtnText}>
            {initial ? 'Enregistrer les modifications' : 'Ajouter le client →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VUE : FORMULAIRE SÉANCE
// ═══════════════════════════════════════════════════════════════════════════════
function SessionForm({ clients, preselectedClientId, onSave, onCancel }) {
  const [clientId,     setClientId]     = useState(preselectedClientId || '');
  const [perturbation, setPerturbation] = useState('');
  const [before,       setBefore]       = useState(7);
  const [after,        setAfter]        = useState(3);
  const [sessionNotes, setSessionNotes] = useState('');
  const [withReminder, setWithReminder] = useState(true);
  const [showClients,  setShowClients]  = useState(!preselectedClientId);

  const selectedClient = clients.find(c => c.id === clientId);
  const valid = clientId && perturbation.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.formTitle}>Nouvelle séance</Text>

        {/* Sélection client */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>CLIENT *</Text>
          {selectedClient && !showClients ? (
            <TouchableOpacity style={styles.selectedClient} onPress={() => setShowClients(true)}>
              <View style={styles.selectedClientAvatar}>
                <Text style={styles.selectedClientInitial}>{selectedClient.name.charAt(0)}</Text>
              </View>
              <Text style={styles.selectedClientName}>{selectedClient.name}</Text>
              <Text style={styles.selectedClientChange}>Changer ›</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.clientList}>
              {clients.length === 0 ? (
                <Text style={styles.noClientText}>Aucun client — ajoutes-en un d'abord.</Text>
              ) : (
                clients.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.clientPickItem, clientId === c.id && styles.clientPickItemActive]}
                    onPress={() => { setClientId(c.id); setShowClients(false); }}
                  >
                    <View style={styles.clientPickAvatar}>
                      <Text style={styles.clientPickInitial}>{c.name.charAt(0)}</Text>
                    </View>
                    <Text style={styles.clientPickName}>{c.name}</Text>
                    {clientId === c.id && <Text style={styles.clientPickCheck}>✓</Text>}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Perturbation */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>PERTURBATION TRAVAILLÉE *</Text>
          <TextInput style={styles.input} placeholder="ex : colère envers son père, peur de l'échec…"
            placeholderTextColor={ph} value={perturbation} onChangeText={setPerturbation} />
        </View>

        {/* Scores */}
        <View style={styles.fieldGroup}>
          <View style={styles.scoreLabelRow}>
            <Text style={styles.fieldLabel}>INTENSITÉ AVANT</Text>
            <Text style={[styles.scoreNum, { color: Colors.pink }]}>{before} / 10</Text>
          </View>
          <ScorePicker value={before} onChange={setBefore} color={Colors.pink} />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.scoreLabelRow}>
            <Text style={styles.fieldLabel}>INTENSITÉ APRÈS</Text>
            <Text style={[styles.scoreNum, { color: Colors.turquoise }]}>{after} / 10</Text>
          </View>
          <ScorePicker value={after} onChange={setAfter} color={Colors.turquoise} />
        </View>

        {/* Déroulement */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>DÉROULEMENT DE LA SÉANCE</Text>
          <TextInput style={[styles.input, styles.tall]}
            placeholder="Réactions, blocages, percées, observations du praticien…"
            placeholderTextColor={ph} value={sessionNotes} onChangeText={setSessionNotes}
            multiline textAlignVertical="top" />
        </View>

        {/* Rappel 10 jours */}
        <TouchableOpacity style={styles.reminderRow} onPress={() => setWithReminder(r => !r)}>
          <View style={[styles.reminderCheck, withReminder && styles.reminderCheckOn]}>
            {withReminder && <Text style={styles.reminderCheckMark}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderLabel}>Rappel de suivi à 10 jours</Text>
            <Text style={styles.reminderSub}>
              Une notification le {fmtDate(followUpDateFor(new Date().toISOString()))}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, !valid && { opacity: 0.4 }]}
          onPress={() => valid && onSave({ clientId, perturbation: perturbation.trim(),
            beforeScore: before, afterScore: after,
            sessionNotes: sessionNotes.trim(), withReminder })}
          disabled={!valid}
        >
          <Text style={styles.primaryBtnText}>Enregistrer la séance →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VUE : DÉTAIL CLIENT
// ═══════════════════════════════════════════════════════════════════════════════
function ClientDetail({ client, sessions, onBack, onEdit, onNewSession, onDeleteSession, onMarkFollowUp }) {
  const [expandedId, setExpandedId] = useState(null);
  const clientSessions = sessions.filter(s => s.clientId === client.id);
  const avgDrop = clientSessions.length
    ? Math.round(clientSessions.reduce((a, s) => a + ((s.beforeScore ?? 0) - (s.afterScore ?? 0)), 0) / clientSessions.length)
    : 0;

  const toggle = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(p => p === id ? null : id);
  };

  return (
    <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>

      {/* Header client */}
      <View style={styles.detailHeader}>
        <View style={styles.detailAvatar}>
          <Text style={styles.detailAvatarText}>{client.name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailName}>{client.name}</Text>
          <Text style={styles.detailSince}>Client depuis le {fmtDate(client.createdAt)}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editBtnText}>Modifier</Text>
        </TouchableOpacity>
      </View>

      {/* Coordonnées */}
      {(client.phone || client.email) && (
        <View style={styles.contactBlock}>
          {client.phone && (
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${client.phone.replace(/\s/g, '')}`)}>
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactText}>{client.phone}</Text>
              <Text style={styles.contactAction}>Appeler ›</Text>
            </TouchableOpacity>
          )}
          {client.email && (
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${client.email}`)}>
              <Text style={styles.contactIcon}>✉️</Text>
              <Text style={styles.contactText}>{client.email}</Text>
              <Text style={styles.contactAction}>Écrire ›</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Notes générales */}
      {client.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesCardLabel}>NOTES</Text>
          <Text style={styles.notesCardText}>{client.notes}</Text>
        </View>
      ) : null}

      {/* Stats */}
      {clientSessions.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{clientSessions.length}</Text>
            <Text style={styles.statLabel}>séances</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: Colors.turquoise }]}>
              {avgDrop > 0 ? `−${avgDrop}` : '—'}
            </Text>
            <Text style={styles.statLabel}>pts moy.</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: Colors.pink }]}>
              {clientSessions.filter(s => ((s.beforeScore ?? 0) - (s.afterScore ?? 0)) >= 5).length}
            </Text>
            <Text style={styles.statLabel}>libérations</Text>
          </View>
        </View>
      )}

      {/* Bouton nouvelle séance */}
      <TouchableOpacity style={styles.newSessionBtn} onPress={onNewSession} activeOpacity={0.85}>
        <Text style={styles.newSessionBtnText}>+ Nouvelle séance</Text>
      </TouchableOpacity>

      {/* Historique */}
      {clientSessions.length === 0 ? (
        <View style={styles.emptySmall}>
          <Text style={styles.emptySmallText}>Aucune séance enregistrée pour ce client.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionLabel}>HISTORIQUE</Text>
          {clientSessions.map(s => {
            const exp  = expandedId === s.id;
            const drop = (s.beforeScore ?? 0) - (s.afterScore ?? 0);
            const fu   = !s.followUpDone && s.followUpDate;
            const fuDays = fu ? daysUntil(s.followUpDate) : null;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.sessionCard, exp && styles.sessionCardOpen]}
                onPress={() => toggle(s.id)}
                activeOpacity={0.85}
              >
                {/* Résumé */}
                <View style={styles.sessionCardHeader}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.sessionPerturbation} numberOfLines={exp ? 0 : 1}>
                      {s.perturbation || 'Sans titre'}
                    </Text>
                    <Text style={styles.sessionCardDate}>{fmtDateTime(s.date)}</Text>
                  </View>
                  <View style={styles.sessionCardRight}>
                    <MiniScore before={s.beforeScore} after={s.afterScore} />
                    <Text style={styles.chevron}>{exp ? '▲' : '▼'}</Text>
                  </View>
                </View>

                {/* Badge suivi */}
                {fu && (
                  <View style={[styles.followUpBadge,
                    fuDays <= 0  ? styles.followUpOverdue :
                    fuDays <= 3  ? styles.followUpSoon    : styles.followUpOk]}>
                    <Text style={styles.followUpBadgeText}>
                      {fuDays <= 0
                        ? `⚠️ Suivi en retard (${Math.abs(fuDays)} j)`
                        : fuDays <= 3
                          ? `⏰ Suivi dans ${fuDays} j`
                          : `📅 Suivi prévu le ${fmtDate(s.followUpDate)}`}
                    </Text>
                  </View>
                )}
                {s.followUpDone && (
                  <View style={styles.followUpDoneBadge}>
                    <Text style={styles.followUpDoneText}>✓ Suivi effectué</Text>
                  </View>
                )}

                {/* Détails dépliés */}
                {exp && (
                  <View style={styles.sessionDetail}>
                    <View style={styles.separator} />

                    {s.sessionNotes ? (
                      <View style={styles.detailBlock}>
                        <Text style={styles.detailBlockLabel}>DÉROULEMENT</Text>
                        <Text style={styles.detailBlockText}>{s.sessionNotes}</Text>
                      </View>
                    ) : null}

                    {drop > 0 && (
                      <View style={styles.dropRow}>
                        <Text style={styles.dropText}>
                          Réduction de <Text style={{ color: Colors.turquoise, fontWeight: '700' }}>
                            {drop} point{drop > 1 ? 's' : ''}
                          </Text>
                          {s.beforeScore > 0 && <Text style={{ color: Colors.gray }}>
                            {' '}({Math.round(drop / s.beforeScore * 100)}%)
                          </Text>}
                        </Text>
                      </View>
                    )}

                    {/* Actions */}
                    <View style={styles.sessionActions}>
                      {!s.followUpDone && s.followUpDate && (
                        <TouchableOpacity
                          style={styles.actionBtnGreen}
                          onPress={() => onMarkFollowUp(s.id, s.followUpNotifId)}
                        >
                          <Text style={styles.actionBtnGreenText}>✓ Suivi effectué</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.actionBtnRed}
                        onPress={() => onDeleteSession(s.id, s.followUpNotifId)}
                      >
                        <Text style={styles.actionBtnRedText}>Supprimer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
const ph = 'rgba(170,170,204,0.3)';

export default function PractitionerModeScreen({ navigation }) {
  const [clients,      setClients]      = useState([]);
  const [sessions,     setSessions]     = useState([]);
  const [tab,          setTab]          = useState('clients'); // 'clients' | 'rappels' | 'outils'
  const [view,         setView]         = useState('main');    // 'main' | 'newClient' | 'editClient' | 'newSession' | 'clientDetail'
  const [selectedClient, setSelectedClient] = useState(null);
  const [preselectedClientId, setPreselectedClientId] = useState(null);
  const [expandedClientId, setExpandedClientId]       = useState(null);

  const load = async () => {
    setClients(await getClients());
    setSessions(await getSessions());
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  // ── Navigation interne ─────────────────────────────────────────────────────
  const goBack = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setView('main');
    setSelectedClient(null);
    setPreselectedClientId(null);
  };

  const openNewSession = (clientId = null) => {
    setPreselectedClientId(clientId);
    setView('newSession');
  };

  const openClientDetail = (client) => {
    setSelectedClient(client);
    setView('clientDetail');
  };

  const openEditClient = (client) => {
    setSelectedClient(client);
    setView('editClient');
  };

  // ── Sauvegarde client ──────────────────────────────────────────────────────
  const handleSaveClient = async (data) => {
    if (view === 'editClient' && selectedClient) {
      await updateClient(selectedClient.id, data);
    } else {
      await saveClient(data);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await load();
    goBack();
  };

  // ── Suppression client ─────────────────────────────────────────────────────
  const handleDeleteClient = (client) =>
    Alert.alert('Supprimer ce client ?', `${client.name} et toutes ses séances seront supprimés.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        // Annule les notifs de suivi
        const clientSessions = sessions.filter(s => s.clientId === client.id);
        for (const s of clientSessions) await cancelFollowUp(s.followUpNotifId);
        await deleteClient(client.id);
        await load();
        goBack();
      }},
    ]);

  // ── Sauvegarde séance ──────────────────────────────────────────────────────
  const handleSaveSession = async ({ clientId, perturbation, beforeScore, afterScore, sessionNotes, withReminder }) => {
    const client   = clients.find(c => c.id === clientId);
    const now      = new Date().toISOString();
    const followUpDate = followUpDateFor(now);
    let   notifId  = null;

    if (withReminder && client) {
      notifId = await scheduleFollowUp(client.name, now);
    }

    await savePractitionerSession({
      clientId,
      clientName:   client?.name || '—',
      perturbation,
      beforeScore,
      afterScore,
      sessionNotes,
      followUpDate:    withReminder ? followUpDate : null,
      followUpDone:    false,
      followUpNotifId: notifId,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await load();
    goBack();
  };

  // ── Suppression séance ─────────────────────────────────────────────────────
  const handleDeleteSession = (id, notifId) =>
    Alert.alert('Supprimer cette séance ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await cancelFollowUp(notifId);
        await deletePractitionerSession(id);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        await load();
      }},
    ]);

  // ── Marquer suivi fait ─────────────────────────────────────────────────────
  const handleMarkFollowUp = async (id, notifId) => {
    await cancelFollowUp(notifId);
    await markFollowUpDone(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await load();
  };

  // ── Rappels en attente ─────────────────────────────────────────────────────
  const pendingFollowUps = sessions.filter(s => !s.followUpDone && s.followUpDate);
  const overdueFollowUps = pendingFollowUps.filter(s => daysUntil(s.followUpDate) <= 0);

  // ── Stats globales ─────────────────────────────────────────────────────────
  const totalDrop    = sessions.reduce((a, s) => a + ((s.beforeScore ?? 0) - (s.afterScore ?? 0)), 0);
  const avgDrop      = sessions.length ? Math.round(totalDrop / sessions.length) : 0;
  const liberations  = sessions.filter(s => ((s.beforeScore ?? 0) - (s.afterScore ?? 0)) >= 5).length;

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDU
  // ══════════════════════════════════════════════════════════════════════════════

  const renderHeader = (title, showAdd, onAdd) => (
    <View style={styles.topBar}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={view === 'main' ? () => navigation.goBack() : goBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.backText}>
          {view === 'main' ? '‹ Retour' : '‹ Retour'}
        </Text>
      </TouchableOpacity>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>MODE PRATICIEN</Text>
      </View>
      {showAdd && (
        <TouchableOpacity onPress={onAdd} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.addBtn}>+ Ajouter</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Vue : détail client ────────────────────────────────────────────────────
  if (view === 'clientDetail' && selectedClient) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />
        {renderHeader(selectedClient.name, false, null)}
        <ClientDetail
          client={selectedClient}
          sessions={sessions}
          onBack={goBack}
          onEdit={() => openEditClient(selectedClient)}
          onNewSession={() => openNewSession(selectedClient.id)}
          onDeleteSession={handleDeleteSession}
          onMarkFollowUp={handleMarkFollowUp}
        />
      </SafeAreaView>
    );
  }

  // ── Vue : formulaires ─────────────────────────────────────────────────────
  if (view === 'newClient' || view === 'editClient') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />
        {renderHeader('', false, null)}
        <ClientForm
          initial={view === 'editClient' ? selectedClient : null}
          onSave={handleSaveClient}
          onCancel={goBack}
        />
      </SafeAreaView>
    );
  }

  if (view === 'newSession') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />
        {renderHeader('', false, null)}
        <SessionForm
          clients={clients}
          preselectedClientId={preselectedClientId}
          onSave={handleSaveSession}
          onCancel={goBack}
        />
      </SafeAreaView>
    );
  }

  // ── Vue principale ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />
      {renderHeader('', tab === 'clients', () => setView('newClient'))}

      {/* Onglets */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'clients' && styles.tabActive]}
          onPress={() => setTab('clients')}
        >
          <Text style={[styles.tabText, tab === 'clients' && styles.tabTextActive]}>
            Clients ({clients.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'rappels' && styles.tabActive]}
          onPress={() => setTab('rappels')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.tabText, tab === 'rappels' && styles.tabTextActive]}>
              Rappels
            </Text>
            {overdueFollowUps.length > 0 && (
              <View style={styles.alertDot}>
                <Text style={styles.alertDotText}>{overdueFollowUps.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'outils' && styles.tabActive]}
          onPress={() => setTab('outils')}
        >
          <Text style={[styles.tabText, tab === 'outils' && styles.tabTextActive]}>
            Outils
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ══ TAB : CLIENTS ══ */}
        {tab === 'clients' && (
          <>
            {/* Stats globales */}
            {sessions.length > 0 && (
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{clients.length}</Text>
                  <Text style={styles.statLabel}>clients</Text>
                </View>
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
            )}

            {clients.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>👤</Text>
                <Text style={styles.emptyText}>Aucun client pour l'instant</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setView('newClient')}>
                  <Text style={styles.primaryBtnText}>+ Ajouter un client</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {clients.map(client => {
                  const clientSessions = sessions.filter(s => s.clientId === client.id);
                  const lastSession    = clientSessions[0];
                  const pendingForClient = clientSessions.filter(s => !s.followUpDone && s.followUpDate && daysUntil(s.followUpDate) <= 3);

                  return (
                    <TouchableOpacity
                      key={client.id}
                      style={styles.clientCard}
                      onPress={() => openClientDetail(client)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.clientCardAvatar}>
                        <Text style={styles.clientCardAvatarText}>{client.name.charAt(0)}</Text>
                      </View>
                      <View style={styles.clientCardInfo}>
                        <View style={styles.clientCardTitleRow}>
                          <Text style={styles.clientCardName}>{client.name}</Text>
                          {pendingForClient.length > 0 && (
                            <View style={styles.alertDot}>
                              <Text style={styles.alertDotText}>!</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.clientCardMeta}>
                          {clientSessions.length === 0
                            ? 'Aucune séance'
                            : `${clientSessions.length} séance${clientSessions.length > 1 ? 's' : ''} · Dernière ${daysAgo(lastSession?.date)}`}
                        </Text>
                        {client.phone && (
                          <Text style={styles.clientCardContact}>{client.phone}</Text>
                        )}
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity style={styles.ghostBtn} onPress={() => openNewSession()}>
                  <Text style={styles.ghostBtnText}>+ Nouvelle séance</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* ══ TAB : RAPPELS ══ */}
        {tab === 'rappels' && (
          <>
            {pendingFollowUps.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>Aucun suivi en attente</Text>
                <Text style={styles.emptySubtext}>
                  Les rappels à 10 jours apparaîtront ici dès qu'une séance est enregistrée.
                </Text>
              </View>
            ) : (
              <>
                {overdueFollowUps.length > 0 && (
                  <View style={styles.overdueSection}>
                    <Text style={styles.overdueSectionTitle}>⚠️ En retard</Text>
                  </View>
                )}
                {pendingFollowUps
                  .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
                  .map(s => {
                    const days     = daysUntil(s.followUpDate);
                    const overdue  = days <= 0;
                    const soon     = days <= 3 && days > 0;
                    const client   = clients.find(c => c.id === s.clientId);

                    return (
                      <View key={s.id} style={[
                        styles.followUpCard,
                        overdue && styles.followUpCardOverdue,
                        soon    && styles.followUpCardSoon,
                      ]}>
                        <View style={styles.followUpCardTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.followUpClientName}>{s.clientName}</Text>
                            <Text style={styles.followUpPerturbation}>{s.perturbation}</Text>
                            <Text style={styles.followUpMeta}>Séance du {fmtDate(s.date)}</Text>
                          </View>
                          <View style={styles.followUpDaysBlock}>
                            <Text style={[styles.followUpDaysNum, overdue ? { color: Colors.pink } : { color: Colors.turquoise }]}>
                              {overdue ? `+${Math.abs(days)}j` : `J-${days}`}
                            </Text>
                            <Text style={styles.followUpDaysLabel}>
                              {overdue ? 'de retard' : 'restants'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.followUpActions}>
                          {client?.phone && (
                            <TouchableOpacity
                              style={styles.callBtn}
                              onPress={() => Linking.openURL(`tel:${client.phone.replace(/\s/g, '')}`)}
                            >
                              <Text style={styles.callBtnText}>📞 Appeler</Text>
                            </TouchableOpacity>
                          )}
                          {client?.email && (
                            <TouchableOpacity
                              style={styles.mailBtn}
                              onPress={() => Linking.openURL(`mailto:${client.email}`)}
                            >
                              <Text style={styles.mailBtnText}>✉️ Écrire</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={() => handleMarkFollowUp(s.id, s.followUpNotifId)}
                          >
                            <Text style={styles.doneBtnText}>✓ Fait</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
              </>
            )}
          </>
        )}

        {/* ══ TAB : OUTILS ══ */}
        {tab === 'outils' && (
          <>
            <View style={styles.outilsIntro}>
              <Text style={styles.outilsIntroText}>
                Outils praticiens — accessibles pendant et avant les séances.
              </Text>
            </View>
            {[
              {
                emoji: '⏱️',
                title: 'Minuteur de séance',
                desc: 'Chrono 2 min 30 + compteur hippopotames',
                color: 'rgba(14,224,229,0.15)',
                borderColor: 'rgba(14,224,229,0.3)',
                labelColor: Colors.turquoise,
                route: 'SessionTimer',
              },
              {
                emoji: '🔍',
                title: "Guide d'investigation",
                desc: '10 cas · 3 colonnes bleu / orange / rouge',
                color: 'rgba(74,144,217,0.12)',
                borderColor: 'rgba(74,144,217,0.3)',
                labelColor: '#4A90D9',
                route: 'Investigation',
              },
              {
                emoji: '📋',
                title: 'Fiche de préparation RDV',
                desc: 'Perturbation · Situation · Instant · Motivation',
                color: 'rgba(128,0,128,0.12)',
                borderColor: 'rgba(128,0,128,0.3)',
                labelColor: Colors.purple,
                route: 'PrepRDV',
              },
              {
                emoji: '🏆',
                title: 'Parcours de certification',
                desc: '5 séances · 3 étapes de feedback chacune',
                color: 'rgba(219,0,115,0.1)',
                borderColor: 'rgba(219,0,115,0.3)',
                labelColor: Colors.pink,
                route: 'Certification',
              },
            ].map(tool => (
              <TouchableOpacity
                key={tool.route}
                style={[styles.toolCard, { backgroundColor: tool.color, borderColor: tool.borderColor }]}
                onPress={() => navigation.navigate(tool.route)}
                activeOpacity={0.8}
              >
                <Text style={styles.toolEmoji}>{tool.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toolTitle, { color: tool.labelColor }]}>{tool.title}</Text>
                  <Text style={styles.toolDesc}>{tool.desc}</Text>
                </View>
                <Text style={[styles.toolChevron, { color: tool.labelColor }]}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.darkBlue },

  topBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  backBtn:   { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  backText:  { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' },
  badge:     { backgroundColor: 'rgba(128,0,128,0.2)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(128,0,128,0.4)' },
  badgeText: { color: Colors.purple, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  addBtn:    { color: Colors.turquoise, fontSize: 13, fontWeight: '600' },

  tabs:          { flexDirection: 'row', marginHorizontal: 16, gap: 8, marginBottom: 4 },
  tab:           { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  tabActive:     { backgroundColor: 'rgba(128,0,128,0.12)', borderColor: Colors.purple },
  tabText:       { color: Colors.gray, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: Colors.purple },

  alertDot:     { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.pink, alignItems: 'center', justifyContent: 'center' },
  alertDotText: { color: Colors.white, fontSize: 10, fontWeight: '700' },

  body: { padding: 16, gap: 10, paddingBottom: 48 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  statBox:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10, alignItems: 'center' },
  statNum:  { fontSize: 20, fontWeight: '700', color: Colors.white },
  statLabel:{ fontSize: 9, color: Colors.gray, marginTop: 2, letterSpacing: 1 },

  empty:       { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyIcon:   { fontSize: 48 },
  emptyText:   { color: Colors.white, fontSize: 16, fontWeight: '600' },
  emptySubtext:{ color: Colors.gray, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // ── Client cards ──
  clientCard:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14 },
  clientCardAvatar:   { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(128,0,128,0.2)', alignItems: 'center', justifyContent: 'center' },
  clientCardAvatarText:{ color: Colors.purple, fontSize: 18, fontWeight: '700' },
  clientCardInfo:     { flex: 1, gap: 3 },
  clientCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clientCardName:     { color: Colors.white, fontSize: 15, fontWeight: '700' },
  clientCardMeta:     { color: Colors.gray, fontSize: 11 },
  clientCardContact:  { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
  chevron:            { color: 'rgba(255,255,255,0.25)', fontSize: 18 },

  ghostBtn:     { padding: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, alignItems: 'center', marginTop: 4 },
  ghostBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },

  // ── Follow-up cards ──
  overdueSection:      { marginBottom: 4 },
  overdueSectionTitle: { color: Colors.pink, fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  followUpCard:        { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, gap: 12 },
  followUpCardOverdue: { borderColor: 'rgba(219,0,115,0.4)', backgroundColor: 'rgba(219,0,115,0.05)' },
  followUpCardSoon:    { borderColor: 'rgba(255,165,0,0.4)', backgroundColor: 'rgba(255,165,0,0.04)' },
  followUpCardTop:     { flexDirection: 'row', gap: 10 },
  followUpClientName:  { color: Colors.white, fontSize: 14, fontWeight: '700' },
  followUpPerturbation:{ color: Colors.gray, fontSize: 12, marginTop: 2 },
  followUpMeta:        { color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 4 },
  followUpDaysBlock:   { alignItems: 'center', justifyContent: 'center', minWidth: 48 },
  followUpDaysNum:     { fontSize: 22, fontWeight: '700' },
  followUpDaysLabel:   { color: Colors.gray, fontSize: 9, marginTop: 2 },
  followUpActions:     { flexDirection: 'row', gap: 8 },
  callBtn:             { flex: 1, padding: 9, backgroundColor: 'rgba(14,224,229,0.1)', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(14,224,229,0.25)' },
  callBtnText:         { color: Colors.turquoise, fontSize: 12, fontWeight: '600' },
  mailBtn:             { flex: 1, padding: 9, backgroundColor: 'rgba(128,0,128,0.1)', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(128,0,128,0.25)' },
  mailBtnText:         { color: Colors.purple, fontSize: 12, fontWeight: '600' },
  doneBtn:             { padding: 9, paddingHorizontal: 16, backgroundColor: 'rgba(14,224,229,0.15)', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(14,224,229,0.3)' },
  doneBtnText:         { color: Colors.turquoise, fontSize: 12, fontWeight: '700' },

  // ── Formulaires ──
  formScroll:  { padding: 20, gap: 16, paddingBottom: 48 },
  formTitle:   { fontSize: 22, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  fieldGroup:  { gap: 8 },
  fieldLabel:  { fontSize: 10, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  input:       { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 13, color: Colors.white, fontSize: 14 },
  tall:        { minHeight: 80, textAlignVertical: 'top' },

  scoreLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreNum:      { fontSize: 14, fontWeight: '700' },

  selectedClient:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(128,0,128,0.1)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(128,0,128,0.3)' },
  selectedClientAvatar:  { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(128,0,128,0.3)', alignItems: 'center', justifyContent: 'center' },
  selectedClientInitial: { color: Colors.purple, fontWeight: '700' },
  selectedClientName:    { color: Colors.white, fontSize: 14, fontWeight: '600', flex: 1 },
  selectedClientChange:  { color: Colors.gray, fontSize: 12 },

  clientList:       { gap: 6 },
  noClientText:     { color: Colors.gray, fontSize: 13, textAlign: 'center', padding: 12 },
  clientPickItem:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
  clientPickItemActive: { borderColor: 'rgba(128,0,128,0.5)', backgroundColor: 'rgba(128,0,128,0.1)' },
  clientPickAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(128,0,128,0.2)', alignItems: 'center', justifyContent: 'center' },
  clientPickInitial:{ color: Colors.purple, fontSize: 13, fontWeight: '700' },
  clientPickName:   { color: Colors.white, fontSize: 13, flex: 1 },
  clientPickCheck:  { color: Colors.purple, fontWeight: '700' },

  reminderRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  reminderCheck:     { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  reminderCheckOn:   { backgroundColor: Colors.turquoise, borderColor: Colors.turquoise },
  reminderCheckMark: { color: Colors.darkBlue, fontSize: 13, fontWeight: '700' },
  reminderLabel:     { color: Colors.white, fontSize: 13, fontWeight: '600' },
  reminderSub:       { color: Colors.gray, fontSize: 11, marginTop: 2 },

  primaryBtn:     { backgroundColor: Colors.purple, padding: 15, borderRadius: 13, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  cancelBtn:      { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText:  { color: 'rgba(255,255,255,0.3)', fontSize: 13 },

  // ── Détail client ──
  detailScroll:  { padding: 16, gap: 14, paddingBottom: 48 },
  detailHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailAvatar:  { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(128,0,128,0.25)', alignItems: 'center', justifyContent: 'center' },
  detailAvatarText: { color: Colors.purple, fontSize: 24, fontWeight: '700' },
  detailName:    { color: Colors.white, fontSize: 20, fontWeight: '700' },
  detailSince:   { color: Colors.gray, fontSize: 11, marginTop: 2 },
  editBtn:       { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  editBtnText:   { color: 'rgba(255,255,255,0.5)', fontSize: 12 },

  contactBlock:  { gap: 6 },
  contactRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  contactIcon:   { fontSize: 16 },
  contactText:   { color: Colors.white, fontSize: 13, flex: 1 },
  contactAction: { color: Colors.turquoise, fontSize: 12 },

  notesCard:      { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 13, gap: 6 },
  notesCardLabel: { fontSize: 9, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  notesCardText:  { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20 },

  newSessionBtn:     { backgroundColor: Colors.purple, padding: 14, borderRadius: 12, alignItems: 'center' },
  newSessionBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },

  sectionLabel: { fontSize: 10, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700', marginTop: 4 },

  sessionCard:        { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  sessionCardOpen:    { borderColor: 'rgba(128,0,128,0.3)', backgroundColor: 'rgba(128,0,128,0.04)' },
  sessionCardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  sessionPerturbation:{ color: Colors.white, fontSize: 13, fontWeight: '600' },
  sessionCardDate:    { color: Colors.gray, fontSize: 11, marginTop: 2 },
  sessionCardRight:   { alignItems: 'flex-end', gap: 4 },
  sessionDetail:      { paddingHorizontal: 13, paddingBottom: 13, gap: 10 },
  separator:          { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  detailBlock:        { gap: 4 },
  detailBlockLabel:   { fontSize: 9, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  detailBlockText:    { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20 },
  dropRow:            { padding: 9, backgroundColor: 'rgba(14,224,229,0.06)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(14,224,229,0.15)' },
  dropText:           { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  sessionActions:     { flexDirection: 'row', gap: 8 },
  actionBtnGreen:     { flex: 1, padding: 9, backgroundColor: 'rgba(14,224,229,0.1)', borderRadius: 9, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(14,224,229,0.25)' },
  actionBtnGreenText: { color: Colors.turquoise, fontSize: 12, fontWeight: '600' },
  actionBtnRed:       { padding: 9, paddingHorizontal: 14, backgroundColor: 'rgba(219,0,115,0.08)', borderRadius: 9, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(219,0,115,0.2)' },
  actionBtnRedText:   { color: Colors.pink, fontSize: 12 },

  followUpBadge:       { marginHorizontal: 13, marginBottom: 8, padding: 7, borderRadius: 8, borderWidth: 1 },
  followUpOk:          { backgroundColor: 'rgba(14,224,229,0.06)', borderColor: 'rgba(14,224,229,0.2)' },
  followUpSoon:        { backgroundColor: 'rgba(255,165,0,0.08)', borderColor: 'rgba(255,165,0,0.3)' },
  followUpOverdue:     { backgroundColor: 'rgba(219,0,115,0.08)', borderColor: 'rgba(219,0,115,0.3)' },
  followUpBadgeText:   { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  followUpDoneBadge:   { marginHorizontal: 13, marginBottom: 8, padding: 7, borderRadius: 8, backgroundColor: 'rgba(14,224,229,0.06)', borderWidth: 1, borderColor: 'rgba(14,224,229,0.15)' },
  followUpDoneText:    { fontSize: 11, color: Colors.turquoise },

  emptySmall:     { paddingVertical: 24, alignItems: 'center' },
  emptySmallText: { color: Colors.gray, fontSize: 13 },

  // ── Outils ──
  outilsIntro:     { padding: 11, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12 },
  outilsIntroText: { color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center' },
  toolCard:        { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1 },
  toolEmoji:       { fontSize: 26 },
  toolTitle:       { fontSize: 14, fontWeight: '700' },
  toolDesc:        { color: Colors.gray, fontSize: 11, marginTop: 3 },
  toolChevron:     { fontSize: 22 },
});
