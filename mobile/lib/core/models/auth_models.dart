class LoginRequest {
  final String email;
  final String password;
  final int area;

  const LoginRequest({required this.email, required this.password, required this.area});

  Map<String, dynamic> toJson() => {'email': email, 'password': password, 'area': area};
}

class LoginResponse {
  final String accessToken;
  final String refreshToken;
  final String expiresAt;

  const LoginResponse({required this.accessToken, required this.refreshToken, required this.expiresAt});

  factory LoginResponse.fromJson(Map<String, dynamic> json) => LoginResponse(
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
        expiresAt: json['expiresAt'] as String,
      );
}

class CurrentUser {
  final int id;
  final String email;
  final String username;
  final int loginArea;
  final List<String> roles;
  final List<String> programs;

  const CurrentUser({
    required this.id,
    required this.email,
    required this.username,
    required this.loginArea,
    required this.roles,
    required this.programs,
  });

  factory CurrentUser.fromJson(Map<String, dynamic> json) => CurrentUser(
        id: json['id'] as int,
        email: json['email'] as String,
        username: json['username'] as String,
        loginArea: json['loginArea'] as int,
        roles: List<String>.from(json['roles'] as List),
        programs: List<String>.from(json['programs'] as List),
      );
}
