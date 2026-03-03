import 'package:cloud_firestore/cloud_firestore.dart';
import '../../domain/entities/delivery.dart';
import '../../domain/repositories/delivery_repository.dart';
import '../models/delivery_model.dart';

class FirestoreDeliveryRepository implements DeliveryRepository {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  @override
  Stream<List<Delivery>> getActiveDeliveries(String driverId) {
    return _firestore
        .collection('deliveries')
        .where('assignedDriver.uid', '==', driverId)
        .where('status', whereIn: ['assigned', 'picked_up', 'in_transit'])
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => DeliveryModel.fromFirestore(doc))
            .toList());
  }

  @override
  Stream<List<Delivery>> getDeliveryHistory(String driverId) {
    return _firestore
        .collection('deliveries')
        .where('assignedDriver.uid', '==', driverId)
        .where('status', isEqualTo: 'delivered')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => DeliveryModel.fromFirestore(doc))
            .toList());
  }

  @override
  Future<Delivery> getDeliveryDetails(String deliveryId) async {
    final doc = await _firestore.collection('deliveries').doc(deliveryId).get();
    if (!doc.exists) throw Exception('Delivery not found');
    return DeliveryModel.fromFirestore(doc);
  }

  @override
  Future<void> updateDeliveryStatus({
    required String deliveryId,
    required String status,
    String? note,
    Map<String, dynamic>? proof,
  }) async {
    // Note: In production, this should call a Cloud Function to validate status transitions.
    // For MVP, we update directly if allowed by security rules.
    final now = DateTime.now();
    final event = DeliveryEventModel(status: status, timestamp: now, note: note);

    await _firestore.collection('deliveries').doc(deliveryId).update({
      'status': status,
      'timeline': FieldValue.arrayUnion([event.toMap()]),
      if (proof != null) 'proof': proof,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}
