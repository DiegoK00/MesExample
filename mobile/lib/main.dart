import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/services/auth_service.dart';
import 'core/services/error_notifier.dart';
import 'core/services/preferences_service.dart';
import 'core/services/users_service.dart';
import 'core/services/programs_service.dart';
import 'core/services/audit_logs_service.dart';
import 'features/auth/login/login_screen.dart';
import 'features/auth/forgot_password/forgot_password_screen.dart';
import 'features/auth/reset_password/reset_password_screen.dart';
import 'features/auth/change_password/change_password_screen.dart';
import 'features/home/home_screen.dart';
import 'features/home/programs_screen.dart';
import 'features/admin/admin_home_screen.dart';
import 'features/admin/users/admin_users_screen.dart';
import 'features/admin/programs/admin_programs_screen.dart';
import 'features/admin/audit_logs/admin_audit_logs_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final errorNotifier = ErrorNotifier();
  final auth = AuthService(errorNotifier: errorNotifier);
  final prefs = PreferencesService();
  await Future.wait([auth.init(), prefs.init()]);
  runApp(MyApp(auth: auth, prefs: prefs, errorNotifier: errorNotifier));
}

class MyApp extends StatefulWidget {
  final AuthService auth;
  final PreferencesService prefs;
  final ErrorNotifier errorNotifier;
  const MyApp({
    super.key,
    required this.auth,
    required this.prefs,
    required this.errorNotifier,
  });

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final GoRouter _router;
  late final UsersService _usersService;
  late final ProgramsService _programsService;
  late final AuditLogsService _auditLogsService;
  final _messengerKey = GlobalKey<ScaffoldMessengerState>();

  @override
  void initState() {
    super.initState();
    _usersService = UsersService(widget.auth);
    _programsService = ProgramsService(widget.auth);
    _auditLogsService = AuditLogsService(widget.auth);

    // Rebuild when theme changes so MaterialApp.router gets the new themeMode.
    widget.prefs.addListener(() => setState(() {}));

    // Show a global SnackBar whenever ErrorNotifier broadcasts a network error.
    widget.errorNotifier.addListener(_onNetworkError);

    _router = GoRouter(
      initialLocation: _initialLocation(),
      refreshListenable: widget.auth,
      redirect: _redirect,
      routes: [
        // ── Area App (area = 2) ────────────────────────────────────────────
        GoRoute(
          path: '/login',
          builder: (_, __) => const LoginScreen(area: 2),
        ),
        GoRoute(
          path: '/home',
          builder: (_, __) => const HomeScreen(),
        ),
        GoRoute(
          path: '/programs',
          builder: (_, __) => const ProgramsScreen(),
        ),
        // ── Area Admin (area = 1) ──────────────────────────────────────────
        GoRoute(
          path: '/admin-login',
          builder: (_, __) => const LoginScreen(area: 1),
        ),
        GoRoute(
          path: '/admin',
          builder: (_, __) => const AdminHomeScreen(),
        ),
        GoRoute(
          path: '/admin/users',
          builder: (_, __) => const AdminUsersScreen(),
        ),
        GoRoute(
          path: '/admin/programs',
          builder: (_, __) => const AdminProgramsScreen(),
        ),
        GoRoute(
          path: '/admin/audit-logs',
          builder: (_, __) => const AdminAuditLogsScreen(),
        ),
        GoRoute(
          path: '/change-password',
          builder: (_, __) => const ChangePasswordScreen(),
        ),
        // ── Password reset (area-agnostic) ────────────────────────────────
        GoRoute(
          path: '/forgot-password/:area',
          builder: (_, state) => ForgotPasswordScreen(
            area: int.tryParse(state.pathParameters['area'] ?? '') ?? 2,
          ),
        ),
        GoRoute(
          path: '/reset-password/:area',
          builder: (_, state) => ResetPasswordScreen(
            area: int.tryParse(state.pathParameters['area'] ?? '') ?? 2,
            token: state.uri.queryParameters['token'] ?? '',
          ),
        ),
      ],
    );
  }

  void _onNetworkError() {
    final message = widget.errorNotifier.currentMessage;
    if (message != null) {
      _messengerKey.currentState
        ?..clearSnackBars()
        ..showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.wifi_off, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(child: Text(message)),
              ],
            ),
            backgroundColor: Colors.red[700],
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 4),
          ),
        );
    }
  }

  @override
  void dispose() {
    widget.errorNotifier.removeListener(_onNetworkError);
    super.dispose();
  }

  String _initialLocation() {
    if (widget.auth.isLoggedIn) {
      return widget.auth.currentUser?.loginArea == 1 ? '/admin' : '/home';
    }
    // Not logged in: go to the last login area used.
    return widget.prefs.lastArea == 1 ? '/admin-login' : '/login';
  }

  String? _redirect(BuildContext context, GoRouterState state) {
    final loggedIn = widget.auth.isLoggedIn;
    final isAdmin = widget.auth.currentUser?.loginArea == 1;
    final loc = state.matchedLocation;

    final isAppLogin = loc == '/login';
    final isAdminLogin = loc == '/admin-login';
    final isAdminRoute = loc.startsWith('/admin');
    final isForgotPassword = loc.startsWith('/forgot-password');
    final isResetPassword = loc.startsWith('/reset-password');

    if (!loggedIn) {
      if (isAppLogin || isAdminLogin || isForgotPassword || isResetPassword) return null;
      return isAdminRoute ? '/admin-login' : '/login';
    }

    if (isAppLogin || isAdminLogin) {
      return isAdmin ? '/admin' : '/home';
    }

    if (isAdmin && !isAdminRoute) return '/admin';
    if (!isAdmin && isAdminRoute) return '/home';

    return null;
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: widget.auth),
        ChangeNotifierProvider.value(value: widget.prefs),
        ChangeNotifierProvider.value(value: widget.errorNotifier),
        Provider.value(value: _usersService),
        Provider.value(value: _programsService),
        Provider.value(value: _auditLogsService),
      ],
      child: MaterialApp.router(
        title: 'MesClaude',
        scaffoldMessengerKey: _messengerKey,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
          useMaterial3: true,
        ),
        darkTheme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.indigo,
            brightness: Brightness.dark,
          ),
          useMaterial3: true,
        ),
        themeMode: widget.prefs.themeMode,
        routerConfig: _router,
      ),
    );
  }
}
