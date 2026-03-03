import 'package:flutter/material.dart';
import '../../domain/entities/delivery.dart';
import 'proof_of_delivery_screen.dart';

class DeliveryDetailsScreen extends StatelessWidget {
  final Delivery delivery;
  const DeliveryDetailsScreen({super.key, required this.delivery});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Order #${delivery.orderId.substring(0, 8)}'),
        backgroundColor: Colors.green,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader('Recipient'),
            _buildInfoRow(Icons.person, delivery.recipientName),
            _buildInfoRow(Icons.phone, delivery.recipientPhone),
            _buildInfoRow(Icons.location_on, delivery.recipientAddress),
            const Divider(),
            _buildSectionHeader('Delivery Details'),
            _buildInfoRow(Icons.status_history, 'Status: ${delivery.status.toUpperCase()}'),
            _buildInfoRow(Icons.attach_money, 'Fee: \$${delivery.deliveryFee.toStringAsFixed(2)}'),
            const SizedBox(height: 24),
            _buildActionButtons(context),
            const SizedBox(height: 24),
            _buildSectionHeader('Timeline'),
            ...delivery.timeline.map((e) => ListTile(
                  title: Text(e.status.toUpperCase()),
                  subtitle: Text(e.timestamp.toString()),
                  leading: const Icon(Icons.check_circle_outline),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 16))),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    if (delivery.status == 'assigned') {
      return ElevatedButton(
        onPressed: () {}, // Add logic for Pick Up
        style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
        child: const Text('PICK UP'),
      );
    } else if (delivery.status == 'picked_up' || delivery.status == 'in_transit') {
      return ElevatedButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ProofOfDeliveryScreen(deliveryId: delivery.id),
            ),
          );
        },
        style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50), backgroundColor: Colors.green),
        child: const Text('COMPLETE DELIVERY', style: TextStyle(color: Colors.white)),
      );
    }
    return const SizedBox.shrink();
  }
}
