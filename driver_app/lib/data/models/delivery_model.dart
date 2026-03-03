import 'package:cloud_firestore/cloud_firestore.dart';
import '../../domain/entities/delivery.dart';

class DeliveryModel extends Delivery {
  const DeliveryModel({
    required String id,
    required String orderId,
    required String locationId,
    required String status,
    required String recipientName,
    required String recipientPhone,
    required String recipientAddress,
    required double deliveryFee,
    required List<DeliveryEventModel> timeline,
    Map<String, dynamic>? proof,
  }) : super(
          id: id,
          orderId: orderId,
          locationId: locationId,
          status: status,
          recipientName: recipientName,
          recipientPhone: recipientPhone,
          recipientAddress: recipientAddress,
          deliveryFee: deliveryFee,
          timeline: timeline,
          proof: proof,
        );

  factory DeliveryModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return DeliveryModel(
      id: doc.id,
      orderId: data['orderId'] ?? '',
      locationId: data['locationId'] ?? '',
      status: data['status'] ?? 'queued',
      recipientName: data['dropoff']?['recipientName'] ?? '',
      recipientPhone: data['dropoff']?['recipientPhone'] ?? '',
      recipientAddress: data['dropoff']?['address'] ?? '',
      deliveryFee: (data['deliveryFee'] ?? 0.0).toDouble(),
      timeline: (data['timeline'] as List? ?? [])
          .map((e) => DeliveryEventModel.fromMap(e as Map<String, dynamic>))
          .toList(),
      proof: data['proof'],
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'orderId': orderId,
      'locationId': locationId,
      'status': status,
      'proof': proof,
      'timeline': timeline.map((e) => (e as DeliveryEventModel).toMap()).toList(),
    };
  }
}

class DeliveryEventModel extends DeliveryEvent {
  const DeliveryEventModel({
    required String status,
    required DateTime timestamp,
    String? note,
  }) : super(status: status, timestamp: timestamp, note: note);

  factory DeliveryEventModel.fromMap(Map<String, dynamic> map) {
    return DeliveryEventModel(
      status: map['status'] ?? '',
      timestamp: (map['timestamp'] as Timestamp).toDate(),
      note: map['note'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'status': status,
      'timestamp': Timestamp.fromDate(timestamp),
      'note': note,
    };
  }
}
