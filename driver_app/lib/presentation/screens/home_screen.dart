import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/delivery_bloc.dart';
import '../../domain/entities/delivery.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // In a real app, this UID would come from Auth service
    context.read<DeliveryBloc>().add(const LoadDeliveries('driver_123'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Zimlymart Deliveries'),
        backgroundColor: Colors.green,
      ),
      body: BlocBuilder<DeliveryBloc, DeliveryState>(
        builder: (context, state) {
          if (state is DeliveryLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is DeliveryLoaded) {
            return RefreshIndicator(
              onRefresh: () async {
                context.read<DeliveryBloc>().add(const LoadDeliveries('driver_123'));
              },
              child: ListView.builder(
                itemCount: state.activeDeliveries.length,
                itemBuilder: (context, index) {
                  return DeliveryCard(delivery: state.activeDeliveries[index]);
                },
              ),
            );
          } else if (state is DeliveryError) {
            return Center(child: Text('Error: ${state.message}'));
          }
          return const Center(child: Text('No active deliveries'));
        },
      ),
    );
  }
}

class DeliveryCard extends StatelessWidget {
  final Delivery delivery;
  const DeliveryCard({super.key, required this.delivery});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8),
      child: ListTile(
        title: Text('Order #${delivery.orderId.substring(0, 8)}'),
        subtitle: Text('Recipient: ${delivery.recipientName}\nStatus: ${delivery.status.toUpperCase()}'),
        trailing: const Icon(Icons.arrow_forward_ios),
        onTap: () {
          // Navigate to details
        },
      ),
    );
  }
}
