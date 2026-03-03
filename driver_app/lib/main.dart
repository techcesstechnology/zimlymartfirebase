import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'presentation/di.dart' as di;
import 'presentation/bloc/delivery_bloc.dart';
import 'presentation/screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(); // Requires google-services.json for Android
  await di.init();
  runApp(const ZimlymartDriverApp());
}

class ZimlymartDriverApp extends StatelessWidget {
  const ZimlymartDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Zimlymart Driver',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      home: BlocProvider(
        create: (context) => di.sl<DeliveryBloc>(),
        child: const HomeScreen(),
      ),
    );
  }
}
