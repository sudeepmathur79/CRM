import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _baseUrl = 'https://crm-mjky.onrender.com/api';
const _storage = FlutterSecureStorage();

Future<String?> _token() => _storage.read(key: 'accessToken');

Map<String, String> _headers([Map<String, String>? extra]) => {
  'Content-Type': 'application/json',
  ...?extra,
};

Future<Map<String, String>> _authHeaders() async {
  final token = await _token();
  return {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────

Future<Map<String, dynamic>> login(String email, String password) async {
  final res = await http.post(
    Uri.parse('$_baseUrl/auth/login'),
    headers: _headers(),
    body: jsonEncode({'email': email, 'password': password}),
  );
  final body = jsonDecode(res.body);
  if (res.statusCode != 200) throw body['error'] ?? 'Login failed';
  await _storage.write(key: 'accessToken', value: body['accessToken']);
  await _storage.write(key: 'refreshToken', value: body['refreshToken']);
  return body;
}

Future<Map<String, dynamic>> me() async {
  final res = await http.get(
    Uri.parse('$_baseUrl/auth/me'),
    headers: await _authHeaders(),
  );
  if (res.statusCode == 401) throw 'Unauthorized';
  return jsonDecode(res.body);
}

Future<void> logout() async {
  await _storage.delete(key: 'accessToken');
  await _storage.delete(key: 'refreshToken');
}

// ── AI ───────────────────────────────────────────────────────────────────────

Future<String> transcribeAudio(String filePath) async {
  final token = await _token();
  final request = http.MultipartRequest(
    'POST',
    Uri.parse('$_baseUrl/ai/transcribe'),
  );
  if (token != null) request.headers['Authorization'] = 'Bearer $token';
  request.files.add(await http.MultipartFile.fromPath(
    'audio',
    filePath,
    filename: 'audio.m4a',
  ));
  final streamed = await request.send();
  final body = jsonDecode(await streamed.stream.bytesToString());
  if (streamed.statusCode != 200) throw body['error'] ?? 'Transcription failed';
  return body['transcript'] as String;
}

Future<Map<String, dynamic>> extractLead(String text) async {
  final res = await http.post(
    Uri.parse('$_baseUrl/ai/extract'),
    headers: await _authHeaders(),
    body: jsonEncode({'text': text}),
  );
  final body = jsonDecode(res.body);
  if (res.statusCode != 200) throw body['error'] ?? 'Extraction failed';
  return body;
}

// ── Leads ────────────────────────────────────────────────────────────────────

Future<List<dynamic>> getLeads({String? search}) async {
  final uri = Uri.parse('$_baseUrl/leads').replace(queryParameters: {
    if (search != null && search.isNotEmpty) 'search': search,
    'take': '50',
  });
  final res = await http.get(uri, headers: await _authHeaders());
  if (res.statusCode != 200) throw 'Failed to load leads';
  return jsonDecode(res.body);
}

Future<Map<String, dynamic>> createLead(Map<String, dynamic> data) async {
  final res = await http.post(
    Uri.parse('$_baseUrl/leads'),
    headers: await _authHeaders(),
    body: jsonEncode(data),
  );
  final body = jsonDecode(res.body);
  if (res.statusCode != 201 && res.statusCode != 200) throw body['error'] ?? 'Failed to create lead';
  return body;
}

Future<Map<String, dynamic>> updateLead(String id, Map<String, dynamic> data) async {
  final res = await http.put(
    Uri.parse('$_baseUrl/leads/$id'),
    headers: await _authHeaders(),
    body: jsonEncode(data),
  );
  final body = jsonDecode(res.body);
  if (res.statusCode != 200) throw body['error'] ?? 'Failed to update lead';
  return body;
}
