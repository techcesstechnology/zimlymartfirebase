import 'package:get_it/get_it.dart';
import '../../domain/repositories/delivery_repository.dart';
import '../../data/repositories/firestore_delivery_repository.dart';
import '../bloc/delivery_bloc.dart';

final sl = GetIt.instance; // sl = Service Locator

Future<void> init() async {
  // BLoCs
  sl.registerFactory(() => DeliveryBloc(repository: sl()));

  // Repositories
  sl.registerLazySingleton<DeliveryRepository>(
    () => FirestoreDeliveryRepository(),
  );

  // External (already initialized in main)
}
