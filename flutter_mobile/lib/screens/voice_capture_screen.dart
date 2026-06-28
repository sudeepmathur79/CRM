import 'dart:async';
import 'package:flutter/material.dart';
import 'package:record/record.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:path_provider/path_provider.dart';
import '../services/api_service.dart' as api;
import 'review_screen.dart';

enum CapturePhase { idle, recording, processing }

class VoiceCaptureScreen extends StatefulWidget {
  const VoiceCaptureScreen({super.key});
  @override
  State<VoiceCaptureScreen> createState() => _VoiceCaptureScreenState();
}

class _VoiceCaptureScreenState extends State<VoiceCaptureScreen>
    with SingleTickerProviderStateMixin {
  final _recorder = AudioRecorder();
  CapturePhase _phase = CapturePhase.idle;
  int _seconds = 0;
  Timer? _timer;
  String? _error;
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))
      ..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );
    _pulseCtrl.stop();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseCtrl.dispose();
    _recorder.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    setState(() { _error = null; });
    final status = await Permission.microphone.request();
    if (!status.isGranted) {
      setState(() { _error = 'Microphone permission denied. Enable it in Settings.'; });
      return;
    }
    final dir = await getTemporaryDirectory();
    final path = '${dir.path}/recording_${DateTime.now().millisecondsSinceEpoch}.m4a';
    await _recorder.start(const RecordConfig(encoder: AudioEncoder.aacLc), path: path);
    setState(() { _phase = CapturePhase.recording; _seconds = 0; });
    _pulseCtrl.repeat(reverse: true);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => setState(() => _seconds++));
  }

  Future<void> _stopAndProcess() async {
    _timer?.cancel();
    _pulseCtrl.stop();
    setState(() { _phase = CapturePhase.processing; });

    try {
      final path = await _recorder.stop();
      if (path == null) throw 'Recording failed — no audio captured';

      // Transcribe via Groq Whisper
      final transcript = await api.transcribeAudio(path);
      if (transcript.trim().isEmpty) throw 'No speech detected. Try again in a quieter space.';

      // AI extract lead info
      final result = await api.extractLead(transcript);
      result['_transcript'] = transcript;

      if (!mounted) return;
      await Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => ReviewScreen(aiResult: result)),
      );
      setState(() { _phase = CapturePhase.idle; });
    } catch (e) {
      setState(() { _error = e.toString(); _phase = CapturePhase.idle; });
    }
  }

  String _fmt(int s) => '${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final isRecording = _phase == CapturePhase.recording;
    final isProcessing = _phase == CapturePhase.processing;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Voice Capture',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 10),
              Text(
                isRecording
                    ? 'Describe your lead — tap to stop'
                    : isProcessing
                        ? 'AI is processing…'
                        : 'Tap the mic and start talking',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280), height: 1.5),
              ),
              const SizedBox(height: 52),

              if (isProcessing)
                const CircularProgressIndicator(color: Color(0xFF4F46E5), strokeWidth: 3)
              else
                GestureDetector(
                  onTap: isRecording ? _stopAndProcess : _startRecording,
                  child: AnimatedBuilder(
                    animation: _pulseAnim,
                    builder: (_, child) => Transform.scale(
                      scale: isRecording ? _pulseAnim.value : 1.0,
                      child: child,
                    ),
                    child: Container(
                      width: 130, height: 130,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isRecording ? const Color(0xFFFEE2E2) : const Color(0xFFE0E7FF),
                      ),
                      child: Center(
                        child: Container(
                          width: 96, height: 96,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isRecording ? const Color(0xFFEF4444) : const Color(0xFF4F46E5),
                          ),
                          child: Icon(
                            isRecording ? Icons.stop_rounded : Icons.mic_rounded,
                            color: Colors.white,
                            size: 42,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

              const SizedBox(height: 24),

              if (isRecording) ...[
                Text(
                  _fmt(_seconds),
                  style: const TextStyle(fontSize: 38, fontWeight: FontWeight.w700, color: Color(0xFFEF4444), letterSpacing: 2),
                ),
                const SizedBox(height: 8),
                const Text('Describe the person, company, and deal', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
              ] else if (!isProcessing)
                const Text('Works best in a quiet space', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),

              if (_error != null) ...[
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(12)),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 18),
                      const SizedBox(width: 10),
                      Expanded(child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13))),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

