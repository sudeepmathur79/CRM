import 'package:flutter/material.dart';
import '../services/api_service.dart' as api;

class LeadsScreen extends StatefulWidget {
  const LeadsScreen({super.key});
  @override
  State<LeadsScreen> createState() => _LeadsScreenState();
}

class _LeadsScreenState extends State<LeadsScreen> {
  List<dynamic> _leads = [];
  bool _loading = true;
  String? _error;
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load([String? search]) async {
    setState(() { _loading = true; _error = null; });
    try {
      _leads = await api.getLeads(search: search);
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  Color _stageColor(String? stage) {
    return switch (stage) {
      'new' => const Color(0xFF6366F1),
      'contacted' => const Color(0xFF3B82F6),
      'qualified' => const Color(0xFF10B981),
      'proposal' => const Color(0xFFF59E0B),
      'won' => const Color(0xFF059669),
      'lost' => const Color(0xFFEF4444),
      _ => const Color(0xFF9CA3AF),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Search
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: TextField(
            controller: _searchCtrl,
            onChanged: (v) => _load(v.trim()),
            decoration: InputDecoration(
              hintText: 'Search leads…',
              hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
              prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF9CA3AF)),
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 2)),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
        ),

        if (_loading)
          const Expanded(child: Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5), strokeWidth: 2)))
        else if (_error != null)
          Expanded(child: Center(child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626)))))
        else if (_leads.isEmpty)
          const Expanded(child: Center(child: Text('No leads found', style: TextStyle(color: Color(0xFF9CA3AF)))))
        else
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _load(_searchCtrl.text.trim()),
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                itemCount: _leads.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final lead = _leads[i];
                  final stage = lead['stage'] as String?;
                  final value = lead['value'];
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(shape: BoxShape.circle, color: _stageColor(stage).withOpacity(0.12)),
                          child: Center(
                            child: Text(
                              (lead['name'] ?? '?')[0].toUpperCase(),
                              style: TextStyle(color: _stageColor(stage), fontWeight: FontWeight.w700, fontSize: 16),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(lead['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Color(0xFF111827))),
                              if (lead['company'] != null)
                                Text(lead['company'], style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(color: _stageColor(stage).withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                              child: Text(stage ?? 'new', style: TextStyle(fontSize: 11, color: _stageColor(stage), fontWeight: FontWeight.w600)),
                            ),
                            if (value != null) ...[
                              const SizedBox(height: 4),
                              Text('\$${value.toString()}', style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280), fontWeight: FontWeight.w500)),
                            ],
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
      ],
    );
  }
}
