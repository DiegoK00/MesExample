class UserResponse {
  final int id;
  final String email;
  final String username;
  final int loginArea;
  final List<String> roles;
  final bool isActive;

  const UserResponse({
    required this.id,
    required this.email,
    required this.username,
    required this.loginArea,
    required this.roles,
    required this.isActive,
  });

  factory UserResponse.fromJson(Map<String, dynamic> json) => UserResponse(
        id: json['id'] as int,
        email: json['email'] as String,
        username: json['username'] as String,
        loginArea: json['loginArea'] as int,
        roles: List<String>.from(json['roles'] as List),
        isActive: json['isActive'] as bool,
      );
}

class UsersPageResponse {
  final List<UserResponse> items;
  final int totalCount;
  final int page;
  final int pageSize;

  const UsersPageResponse({
    required this.items,
    required this.totalCount,
    required this.page,
    required this.pageSize,
  });

  factory UsersPageResponse.fromJson(Map<String, dynamic> json) => UsersPageResponse(
        items: (json['items'] as List)
            .map((e) => UserResponse.fromJson(e as Map<String, dynamic>))
            .toList(),
        totalCount: json['totalCount'] as int,
        page: json['page'] as int,
        pageSize: json['pageSize'] as int,
      );
}
