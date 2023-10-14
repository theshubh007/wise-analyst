import 'package:dio/dio.dart';

import 'Token_manager.dart';

class ApiService {
  final Dio _dio;

  ApiService() : _dio = Dio();
  String? _cachedToken;
  //  Future<dynamic> authpost(String endpoint, dynamic data) async {
  //   final url =  Uri.parse(endpoint);

  //   try {
  //    var response = await http.post(url, body: data);
  //    print(response.body);
  //     return response;
  //   } catch (error) {
  //     // Handle error
  //     rethrow;
  //   }
  // }

  Future<Response> authpost(String endpoint, dynamic data) async {
    final url = endpoint;

    try {
      final response = await _dio.post(url, data: data);
      return response;
    } catch (error) {
      if (error is DioError && error.response != null) {
        return error.response!;
      } else {
        rethrow;
      }
    }
  }

  Future<Response> get(String endpoint) async {
    final url = endpoint;
    final options = await _buildOptions();
    try {
      final response = await _dio.get(url, options: options);
      return response;
    } catch (error) {
      // Handle error
      rethrow;
    }
  }

  Future<Response> post(String endpoint, dynamic data) async {
    try {
      final url = endpoint;
      final options = await _buildOptions();
      print('options are $options'.toString());
      final response = await _dio.post(url, data: data, options: options);
      return response;
    } catch (error) {
      // if (error is DioError) {
      //   if (error.response?.statusCode == 403) {

      //   }
      // }
      // Handle error
      rethrow;
    }
  }

  Future<Response> put(String endpoint, dynamic data) async {
    try {
      final url = endpoint;
      final options = await _buildOptions();
      print('options are $options'.toString());
      final response = await _dio.put(url, data: data, options: options);
      return response;
    } catch (error) {
      // Handle error
      rethrow;
    }
  }

  Future<Options> _buildOptions() async {
     String token = _cachedToken ?? await TokenManager.getToken();
    _cachedToken = token; // Cache the token value

    // String token = await TokenManager.getToken();
    print("tokenid: $token".toString());
    print("tokenid: $token".toString());
    print("tokenid: $token".toString());
    final options = Options(headers: {
      'Authorization': 'Bearer $token',
    });
    return options;
  }

 
}
