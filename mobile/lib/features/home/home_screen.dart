import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/services/auth_service.dart';
import '../../core/services/preferences_service.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final prefs = context.watch<PreferencesService>();
    final user = auth.currentUser;
    final isDark = prefs.themeMode == ThemeMode.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('MesClaude'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            tooltip: isDark ? 'Modalità chiara' : 'Modalità scura',
            onPressed: () => prefs.setThemeMode(isDark ? ThemeMode.light : ThemeMode.dark),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Esci',
            onPressed: () async {
              await auth.logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Benvenuto, ${user?.username ?? ''}',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            Card(
              child: ListTile(
                leading: const Icon(Icons.person, color: Colors.indigo),
                title: const Text('Email'),
                subtitle: Text(user?.email ?? ''),
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: ListTile(
                leading: const Icon(Icons.verified_user, color: Colors.indigo),
                title: const Text('Ruoli'),
                subtitle: Text(user?.roles.join(', ') ?? '—'),
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: ListTile(
                leading: const Icon(Icons.lock, color: Colors.indigo),
                title: const Text('Cambia password'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/change-password'),
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: ListTile(
                leading: const Icon(Icons.apps, color: Colors.indigo),
                title: const Text('Programmi assegnati'),
                subtitle: Text(
                  user?.programs.isEmpty == true
                      ? 'Nessuno'
                      : '${user!.programs.length} programm${user.programs.length == 1 ? 'o' : 'i'}',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/programs'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
