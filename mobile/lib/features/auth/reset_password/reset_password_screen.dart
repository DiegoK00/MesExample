import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/services/auth_service.dart';

class ResetPasswordScreen extends StatefulWidget {
  final int area;
  final String token;
  const ResetPasswordScreen({super.key, required this.area, required this.token});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _loading = false;
  bool _done = false;
  bool _showPassword = false;
  String? _error;

  @override
  void dispose() {
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });

    try {
      await context.read<AuthService>().resetPassword(widget.token, _passwordCtrl.text);
      if (mounted) setState(() { _loading = false; _done = true; });
    } catch (_) {
      if (mounted) setState(() {
        _loading = false;
        _error = 'Token non valido o scaduto. Richiedi un nuovo link di reset.';
      });
    }
  }

  String get _loginRoute => widget.area == 1 ? '/admin-login' : '/login';
  String get _forgotRoute => widget.area == 1 ? '/forgot-password/1' : '/forgot-password/2';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(title: const Text('Nuova password')),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: widget.token.isEmpty
                    ? _buildInvalidToken()
                    : _done
                        ? _buildSuccess()
                        : _buildForm(),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInvalidToken() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.error_outline, size: 48, color: Theme.of(context).colorScheme.error),
        const SizedBox(height: 12),
        const Text('Token non valido', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text('Il link di reset non è valido. Richiedi un nuovo link.',
            textAlign: TextAlign.center),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () => context.go(_loginRoute),
            child: const Text('Torna al login'),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccess() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.check_circle_outline, size: 56, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 16),
        const Text('Password aggiornata', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Text('Puoi ora accedere con la nuova password.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600])),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: () => context.go(_loginRoute),
            child: const Text('Vai al login'),
          ),
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.lock_reset, size: 48, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 16),
          Text('Imposta nuova password',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          TextFormField(
            controller: _passwordCtrl,
            obscureText: !_showPassword,
            decoration: InputDecoration(
              labelText: 'Nuova password',
              prefixIcon: const Icon(Icons.lock_outline),
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility),
                onPressed: () => setState(() => _showPassword = !_showPassword),
              ),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Password obbligatoria';
              if (v.length < 8) return 'Minimo 8 caratteri';
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _confirmCtrl,
            obscureText: !_showPassword,
            decoration: const InputDecoration(
              labelText: 'Conferma password',
              prefixIcon: Icon(Icons.lock_outline),
              border: OutlineInputBorder(),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Conferma obbligatoria';
              if (v != _passwordCtrl.text) return 'Le password non coincidono';
              return null;
            },
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
                  : const Text('Imposta password', style: TextStyle(fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }
}
