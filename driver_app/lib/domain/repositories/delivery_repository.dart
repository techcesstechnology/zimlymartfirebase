import 'delivery.dart';

abstract class DeliveryRepository {
  Stream<List<Delivery>> getActiveDeliveries(String driverId);
  Stream<List<Delivery>> getDeliveryHistory(String driverId);
  Future<Delivery> getDeliveryDetails(String deliveryId);
  Future<void> updateDeliveryStatus({
    required String deliveryId,
    required String status,
    String? note,
    Map<String, dynamic>? proof,
  });
}
