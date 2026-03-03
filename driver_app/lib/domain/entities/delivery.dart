import 'package:equatable/equatable.dart';

class Delivery extends Equatable {
  final String id;
  final String orderId;
  final String locationId;
  final String status;
  final String recipientName;
  final String recipientPhone;
  final String recipientAddress;
  final double deliveryFee;
  final List<DeliveryEvent> timeline;
  final Map<String, dynamic>? proof;

  const Delivery({
    required this.id,
    required this.orderId,
    required this.locationId,
    required this.status,
    required this.recipientName,
    required this.recipientPhone,
    required this.recipientAddress,
    required this.deliveryFee,
    required this.timeline,
    this.proof,
  });

  @override
  List<Object?> get props => [id, status, timeline, proof];
}

class DeliveryEvent extends Equatable {
  final String status;
  final DateTime timestamp;
  final String? note;

  const DeliveryEvent({
    required this.status,
    required this.timestamp,
    this.note,
  });

  @override
  List<Object?> get props => [status, timestamp, note];
}
