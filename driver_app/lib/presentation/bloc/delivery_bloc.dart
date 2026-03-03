import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/delivery.dart';
import '../../domain/repositories/delivery_repository.dart';

// Events
abstract class DeliveryEvent extends Equatable {
  const DeliveryEvent();
  @override
  List<Object?> get props => [];
}

class LoadDeliveries extends DeliveryEvent {
  final String driverId;
  const LoadDeliveries(this.driverId);
  @override
  List<Object?> get props => [driverId];
}

class UpdateDeliveryStatus extends DeliveryEvent {
  final String deliveryId;
  final String status;
  final String? note;
  final Map<String, dynamic>? proof;

  const UpdateDeliveryStatus({
    required this.deliveryId,
    required this.status,
    this.note,
    this.proof,
  });

  @override
  List<Object?> get props => [deliveryId, status, note, proof];
}

// States
abstract class DeliveryState extends Equatable {
  const DeliveryState();
  @override
  List<Object?> get props => [];
}

class DeliveryInitial extends DeliveryState {}

class DeliveryLoading extends DeliveryState {}

class DeliveryLoaded extends DeliveryState {
  final List<Delivery> activeDeliveries;
  final List<Delivery> history;

  const DeliveryLoaded({
    required this.activeDeliveries,
    required this.history,
  });

  @override
  List<Object?> get props => [activeDeliveries, history];
}

class DeliveryError extends DeliveryState {
  final String message;
  const DeliveryError(this.message);
  @override
  List<Object?> get props => [message];
}

// Bloc
class DeliveryBloc extends Bloc<DeliveryEvent, DeliveryState> {
  final DeliveryRepository repository;

  DeliveryBloc({required this.repository}) : super(DeliveryInitial()) {
    on<LoadDeliveries>((event, emit) async {
      emit(DeliveryLoading());
      try {
        // In a real app, we'd use CombineLatest for these streams
        // For simplicity, we'll just listen to one or handle them separately
        final activeStream = repository.getActiveDeliveries(event.driverId);
        final historyStream = repository.getDeliveryHistory(event.driverId);

        await emit.forEach<List<Delivery>>(
          activeStream,
          onData: (active) => DeliveryLoaded(
            activeDeliveries: active,
            history: [], // Placeholder
          ),
          onError: (error, stackTrace) => DeliveryError(error.toString()),
        );
      } catch (e) {
        emit(DeliveryError(e.toString()));
      }
    });

    on<UpdateDeliveryStatus>((event, emit) async {
      try {
        await repository.updateDeliveryStatus(
          deliveryId: event.deliveryId,
          status: event.status,
          note: event.note,
          proof: event.proof,
        );
      } catch (e) {
        emit(DeliveryError(e.toString()));
      }
    });
  }
}
