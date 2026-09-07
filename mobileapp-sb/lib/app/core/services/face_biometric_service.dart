import 'dart:math';
import 'package:get/get.dart';

// ponytail: Simplified FaceBiometricService mimicking ML Kit + MobileFaceNet 192-dim extraction.
// In a real app, this would bridge to native SDKs via tflite_flutter and google_mlkit_face_detection.

class FaceBiometricService extends GetxService {
  /// Simulate generating a 192-dimensional normalized face embedding vector.
  Future<List<double>> extractDummyEmbedding() async {
    // Simulate processing time
    await Future.delayed(const Duration(seconds: 2));
    
    final random = Random();
    final List<double> vector = List.generate(192, (_) => (random.nextDouble() * 2) - 1.0);
    
    // L2 Normalization
    double sumSquares = 0.0;
    for (final v in vector) {
      sumSquares += v * v;
    }
    final norm = sumSquares > 0 ? (1.0 / sqrt(sumSquares)) : 1.0;
    
    return vector.map((e) => e * norm).toList();
  }

  /// Calculates Euclidean Distance (L2) between two 192-dim vectors.
  /// Distance <= 0.85 indicates a match.
  double calculateEuclideanDistance(List<double> vector1, List<double> vector2) {
    if (vector1.length != 192 || vector2.length != 192) {
      throw ArgumentError('Vectors must be 192-dimensional');
    }
    
    double sumSq = 0.0;
    for (int i = 0; i < 192; i++) {
      final diff = vector1[i] - vector2[i];
      sumSq += diff * diff;
    }
    return sqrt(sumSq);
  }
}
