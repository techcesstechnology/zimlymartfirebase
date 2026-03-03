import 'package:flutter/material.dart';
import 'package:pin_code_fields/pin_code_fields.dart';

class ProofOfDeliveryScreen extends StatefulWidget {
  final String deliveryId;
  const ProofOfDeliveryScreen({super.key, required this.deliveryId});

  @override
  State<ProofOfDeliveryScreen> createState() => _ProofOfDeliveryScreenState();
}

class _ProofOfDeliveryScreenState extends State<ProofOfDeliveryScreen> {
  final TextEditingController _otpController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify Delivery')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text('Enter the OTP provided by the recipient:', style: TextStyle(fontSize: 16)),
            const SizedBox(height: 20),
            PinCodeTextField(
              appContext: context,
              length: 4,
              controller: _otpController,
              onChanged: (v) {},
              pinTheme: PinTheme(
                shape: PinCodeFieldShape.box,
                borderRadius: BorderRadius.circular(5),
                activeColor: Colors.green,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {}, // Trigger camera photo upload
              icon: const Icon(Icons.camera_alt),
              label: const Text('CAPTURE PHOTO PROOF'),
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: () {
                // Submit proof (Call BLoC event)
              },
              style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50), backgroundColor: Colors.green),
              child: const Text('SUBMIT', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
