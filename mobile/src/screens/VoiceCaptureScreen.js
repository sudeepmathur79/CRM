import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, TextInput, Animated
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { aiApi, leadsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PHASE = { IDLE: 'idle', RECORDING: 'recording', PROCESSING: 'processing', REVIEW: 'review', SAVED: 'saved' };

export default function VoiceCaptureScreen() {
  const { user } = useAuth();
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [recording, setRecording] = useState(null);
  const [duration, setDuration] = useState(0);
  const [aiResult, setAiResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Audio.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    if (phase === PHASE.RECORDING) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      clearInterval(timerRef.current);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setDuration(0);
      setPhase(PHASE.RECORDING);
    } catch (e) {
      Alert.alert('Microphone error', 'Could not access the microphone. Check app permissions.');
    }
  };

  const stopAndProcess = async () => {
    setPhase(PHASE.PROCESSING);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();

      // Upload to backend for Groq Whisper transcription
      const formData = new FormData();
      formData.append('audio', { uri, name: 'audio.m4a', type: 'audio/m4a' });
      const transcribeRes = await aiApi.transcribe(formData);
      const transcript = transcribeRes.data.transcript;

      if (!transcript?.trim()) {
        Alert.alert('No speech detected', 'Try again with a clearer recording.');
        setPhase(PHASE.IDLE);
        return;
      }

      // AI extract lead info
      const extractRes = await aiApi.extract(transcript);
      setAiResult({ ...extractRes.data, _transcript: transcript });
      setPhase(PHASE.REVIEW);
    } catch (e) {
      Alert.alert('Processing failed', e.response?.data?.error || 'Could not process audio. Please try again.');
      setPhase(PHASE.IDLE);
    }
  };

  const saveLead = async () => {
    if (!aiResult) return;
    setSaving(true);
    try {
      const matchedId = aiResult._sync?.localLeadId;
      if (matchedId) {
        // Lead was already created by /ai/extract — just confirm
        Alert.alert('Saved', `Lead "${aiResult.name || aiResult.company}" updated.`);
      } else {
        await leadsApi.create({
          name: aiResult.name || `${aiResult.company || 'Unknown'} — New Lead`,
          contactName: aiResult.contactName,
          company: aiResult.company,
          email: aiResult.email,
          phone: aiResult.phone,
          value: aiResult.dealValue,
          notes: aiResult._transcript,
        });
        Alert.alert('Lead saved', `"${aiResult.name || aiResult.company}" added to your pipeline.`);
      }
      setPhase(PHASE.IDLE);
      setAiResult(null);
    } catch (e) {
      Alert.alert('Save failed', e.response?.data?.error || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fmtDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (phase === PHASE.REVIEW && aiResult) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentPad}>
        <Text style={styles.heading}>Review lead</Text>
        <Text style={styles.subheading}>AI extracted the following. Edit before saving.</Text>

        <ReviewField label="Deal name" value={aiResult.name} onChangeText={v => setAiResult(r => ({ ...r, name: v }))} />
        <ReviewField label="Contact" value={aiResult.contactName} onChangeText={v => setAiResult(r => ({ ...r, contactName: v }))} />
        <ReviewField label="Company" value={aiResult.company} onChangeText={v => setAiResult(r => ({ ...r, company: v }))} />
        <ReviewField label="Email" value={aiResult.email} onChangeText={v => setAiResult(r => ({ ...r, email: v }))} keyboardType="email-address" />
        <ReviewField label="Phone" value={aiResult.phone} onChangeText={v => setAiResult(r => ({ ...r, phone: v }))} keyboardType="phone-pad" />
        <ReviewField label="Deal value ($)" value={aiResult.dealValue ? String(aiResult.dealValue) : ''} onChangeText={v => setAiResult(r => ({ ...r, dealValue: parseFloat(v) || undefined }))} keyboardType="numeric" />

        {aiResult.nextFollowUp && (
          <View style={styles.infoRow}>
            <Text style={styles.fieldLabel}>Follow-up</Text>
            <Text style={styles.infoValue}>{aiResult.nextFollowUp}</Text>
          </View>
        )}

        <View style={styles.transcript}>
          <Text style={styles.transcriptLabel}>Transcript</Text>
          <Text style={styles.transcriptText}>{aiResult._transcript}</Text>
        </View>

        <TouchableOpacity style={[styles.btn, styles.btnPrimary, saving && styles.btnDisabled]} onPress={saveLead} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save lead</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary, { marginTop: 10 }]} onPress={() => { setPhase(PHASE.IDLE); setAiResult(null); }}>
          <Text style={styles.btnSecondaryText}>Discard</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        {/* Header */}
        <Text style={styles.heading}>Voice Capture</Text>
        <Text style={styles.subheading}>
          {phase === PHASE.IDLE && 'Tap record, describe your lead, then stop.'}
          {phase === PHASE.RECORDING && 'Recording… tap to stop'}
          {phase === PHASE.PROCESSING && 'AI is processing…'}
        </Text>

        {/* Mic button */}
        {phase === PHASE.PROCESSING ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginVertical: 48 }} />
        ) : (
          <TouchableOpacity
            onPress={phase === PHASE.IDLE ? startRecording : stopAndProcess}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.micOuter, phase === PHASE.RECORDING && styles.micOuterActive, { transform: [{ scale: phase === PHASE.RECORDING ? pulseAnim : 1 }] }]}>
              <View style={[styles.micInner, phase === PHASE.RECORDING && styles.micInnerActive]}>
                <Text style={styles.micIcon}>{phase === PHASE.RECORDING ? '⏹' : '🎙'}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        )}

        {phase === PHASE.RECORDING && (
          <Text style={styles.timer}>{fmtDuration(duration)}</Text>
        )}

        <Text style={styles.hint}>
          {phase === PHASE.IDLE && 'Works best in a quiet space'}
          {phase === PHASE.RECORDING && 'Describe the person, company, and deal'}
        </Text>
      </View>
    </View>
  );
}

function ReviewField({ label, value, onChangeText, keyboardType }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.reviewInput}
        value={value || ''}
        onChangeText={onChangeText}
        placeholder={`—`}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  contentPad: { padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  heading: { fontSize: 24, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  subheading: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  micOuter: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  micOuterActive: { backgroundColor: '#fee2e2' },
  micInner: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center',
  },
  micInnerActive: { backgroundColor: '#ef4444' },
  micIcon: { fontSize: 36 },
  timer: { fontSize: 36, fontWeight: '700', color: '#ef4444', letterSpacing: 2, marginBottom: 12 },
  hint: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#111827',
  },
  infoRow: { marginBottom: 14 },
  infoValue: { fontSize: 15, color: '#374151', paddingVertical: 4 },
  transcript: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 14, marginBottom: 24 },
  transcriptLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' },
  transcriptText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  btn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#4f46e5' },
  btnSecondary: { backgroundColor: '#f3f4f6' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  btnSecondaryText: { color: '#374151', fontWeight: '600', fontSize: 16 },
});
