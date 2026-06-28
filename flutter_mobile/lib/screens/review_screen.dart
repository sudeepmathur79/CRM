import 'package:flutter/material.dart';
import '../services/api_service.dart' as api;

class ReviewScreen extends StatefulWidget {
  final Map<String, dynamic> aiResult;
  const ReviewScreen({super.key, required this.aiResult});
  @override
  State<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends State<ReviewScreen> {
  late final Map<String, dynamic> _data;
  final _controllers = <String, TextEditingController>{};
  bool _saving = false;
  String? _error;

  static const _fields = [
    ('Deal name', 'name'),
    ('Contact', 'contactName'),
    ('Company', 'company'),
    ('Email', 'email'),
    ('Phone', 'phone'),
    ('Deal value (\$)', 'dealValue'),
  ];

  @override
  void initState() {
    super.initState();
    _data = Map<String, dynamic>.from(widget.aiResult);
    for (final (_, key) in _fields) {
      _controllers[key] = TextEditingController(text: _data[key]?.toString() ?? '');
    }
  }

  @override
  void dispose() {
    for (final c in _controllers.values) c.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() { _saving = true; _error = null; });
    try {
      final existingId = _data['_sync']?['localLeadId'];
      final payload = <String, dynamic>{
        'name': _controllers['name']!.text.trim().isEmpty
            ? '${_controllers['company']!.text.trim()} — New Lead'
            : _controllers['name']!.text.trim(),
        if (_controllers['contactName']!.text.trim().isNotEmpty) 'contactName': _controllers['contactName']!.text.trim(),
        if (_controllers['company']!.text.trim().isNotEmpty) 'company': _controllers['company']!.text.trim(),
        if (_controllers['email']!.text.trim().isNotEmpty) 'email': _controllers['email']!.text.trim(),
        if (_controllers['phone']!.text.trim().isNotEmpty) 'phone': _controllers['phone']!.text.trim(),
        if (_controllers['dealValue']!.text.trim().isNotEmpty) 'value': double.tryParse(_controllers['dealValue']!.text) ?? 0,
        'notes': _data['_transcript'] ?? '',
      };

      if (existingId != null) {
        await api.updateLead(existingId, payload);
      } else {
        await api.createLead(payload);
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(existingId != null ? 'Lead updated' : 'Lead saved to pipeline'),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      setState(() { _error = e.toString(); });
    } finally {
      if (mounted) setState(() { _saving = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Review Lead', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        centerTitle: false,
        surfaceTintColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE5E7EB)),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFEEF2FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome, size: 14, color: Color(0xFF4F46E5)),
                const SizedBox(width: 6),
                const Text('AI extracted — edit before saving', style: TextStyle(fontSize: 12, color: Color(0xFF4F46E5), fontWeight: FontWeight.w500)),
              ],
            ).paddingH(10).paddingV(8),
          ),
          const SizedBox(height: 20),

          for (final (label, key) in _fields) ...[
            _FieldInput(label: label, controller: _controllers[key]!, isNumber: key == 'dealValue'),
            const SizedBox(height: 14),
          ],

          if (_data['nextFollowUp'] != null) ...[
            _InfoRow(label: 'Follow-up', value: _data['nextFollowUp'].toString()),
            const SizedBox(height: 14),
          ],

          // Transcript
          const Text('Transcript', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF6B7280), letterSpacing: 0.5)),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(12)),
            child: Text(_data['_transcript'] ?? '', style: const TextStyle(fontSize: 13, color: Color(0xFF374151), height: 1.6)),
          ),

          if (_error != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(10)),
              child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13)),
            ),
          ],

          const SizedBox(height: 28),
          FilledButton(
            onPressed: _saving ? null : _save,
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF4F46E5),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Save lead', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              side: const BorderSide(color: Color(0xFFD1D5DB)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text('Discard', style: TextStyle(fontSize: 16, color: Color(0xFF374151), fontWeight: FontWeight.w500)),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _FieldInput extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final bool isNumber;
  const _FieldInput({required this.label, required this.controller, this.isNumber = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF6B7280), letterSpacing: 0.5)),
        const SizedBox(height: 5),
        TextField(
          controller: controller,
          keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
          style: const TextStyle(fontSize: 15, color: Color(0xFF111827)),
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 2)),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label, value;
  const _InfoRow({required this.label, required this.value});
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF6B7280), letterSpacing: 0.5)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 15, color: Color(0xFF374151))),
      ],
    );
  }
}

extension _Pad on Widget {
  Widget paddingH(double h) => Padding(padding: EdgeInsets.symmetric(horizontal: h), child: this);
  Widget paddingV(double v) => Padding(padding: EdgeInsets.symmetric(vertical: v), child: this);
}
