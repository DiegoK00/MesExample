import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/services/auth_service.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPwdCtrl = TextEditingController();
  final _newPwdCtrl = TextEditingController();
  final _confirmPwdCtrl = TextEditingController();

  bool _loading = false;
  bool _showPwd = false;
  bool _success = false;
  String? _error;

  @override
  void dispose() {
    _currentPwdCtrl.dispose();
    _newPwdCtrl.dispose();
    _confirmPwdCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });

    try {
      await context.read<AuthService>().changePassword(
        _currentPwdCtrl.text,
        _newPwdCtrl.text,
      );
      if (mounted) setState(() { _success = true; _loading = false; });
    } catch (_) {
      if (mounted) setState(() { _error = 'Password attuale non corretta.'; _loading = false; });
    }
  }

  String? _validateNewPassword(String? v) {
    if (v == null || v.isEmpty) return 'Nuova password obbligatoria';
    if (v.length < 8) return 'Minimo 8 caratteri';
    return null;
  }

  String? _validateConfirm(String? v) {
    if (v == null || v.isEmpty) return 'Conferma obbligatoria';
    if (v != _newPwdCtrl.text) return 'Le password non coincidono';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthService>();
    final backRoute = auth.currentUser?.loginArea == 1 ? '/admin' : '/home';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cambia password'),
        leading: BackButton(onPressed: () => context.go(backRoute)),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: _success ? _buildSuccess(context, backRoute) : _buildForm(context),
          ),
        ),
      ),
    );
  }

  Widget _buildSuccess(BuildContext context, String backRoute) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.check_circle, size: 64, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 16),
        Text(
          'Password aggiornata',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'La tua password è stata cambiata con successo.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: () => context.go(backRoute),
            child: const Text('Torna alla home'),
          ),
        ),
      ],
    );
  }

  Widget _buildForm(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Cambia password',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          TextFormField(
            controller: _currentPwdCtrl,
            obscureText: !_showPwd,
            decoration: InputDecoration(
              labelText: 'Password attuale',
              prefixIcon: const Icon(Icons.lock_outline),
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: Icon(_showPwd ? Icons.visibility_off : Icons.visibility),
                onPressed: () => setState(() => _showPwd = !_showPwd),
              ),
            ),
            validator: (v) => (v == null || v.isEmpty) ? 'Password attuale obbligatoria' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _newPwdCtrl,
            obscureText: !_showPwd,
            decoration: const InputDecoration(
              labelText: 'Nuova password',
              prefixIcon: Icon(Icons.lock),
              border: OutlineInputBorder(),
            ),
            validator: _validateNewPassword,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _confirmPwdCtrl,
            obscureText: !_showPwd,
            decoration: const InputDecoration(
              labelText: 'Conferma nuova password',
              prefixIcon: Icon(Icons.lock),
              border: OutlineInputBorder(),
            ),
            validator: _validateConfirm,
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Salva', style: TextStyle(fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }
}
