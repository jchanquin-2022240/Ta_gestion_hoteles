import { response } from "express";
import Habitacion from './bedrooms.model.js';
import Reservacion from '../reservations/reservations.model.js';
import Hotel from '../hoteles/hotel.model.js';
import {
    validarNumeroHabitacionUnico
} from "../helpers/db-validators.js";

export const habitacionPost = async (req, res) => {
    try {
        const { numero, tipo, capacidad, precio, idHotel } = req.body;

        const hotel = await Hotel.findById(idHotel);

        if (!hotel) {
            return res.status(404).json({ msg: 'Hotel not found' });
        }

        await validarNumeroHabitacionUnico(numero);

        const habitacion = new Habitacion({ numero, tipo, capacidad, precio, hotel: idHotel });
        await habitacion.save();

        // Agregar el ID de la habitación al arreglo de habitaciones del hotel
        hotel.bedrooms.push(habitacion._id);
        await hotel.save();

        res.status(200).json({
            msg: '¡Habitación creada exitosamente!',
            habitacion
        });
    } catch (error) {
        if (error.message === 'La capacidad de la habitación debe ser mayor que cero') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Error creating habitacion:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const habitacionPut = async (req, res) => {
    try {
        const { id } = req.params;
        const { _id, ...resto } = req.body;

        const habitacionActualizada = await Habitacion.findByIdAndUpdate(id, resto);

        res.status(200).json({
            msg: '¡Habitación actualizada exitosamente!',
            habitacion: habitacionActualizada
        });
    } catch (error) {
        console.error('Error updating habitacion:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const habitacionDelete = async (req, res) => {
    try {
        const { id } = req.params;

        const habitacionToDelete = await Habitacion.findById(id);

        if (!habitacionToDelete) {
            return res.status(404).json({ error: 'Habitacion not found' });
        }

        const reservaciones = await Reservacion.find({ habitacion: id });

        if (reservaciones.length > 0) {
            return res.status(400).json({ error: 'No se puede eliminar la habitación, tiene reservaciones asociadas' });
        }

        await Habitacion.findByIdAndDelete(id);

        res.status(200).json({
            msg: '¡Habitación eliminada exitosamente!',
            habitacion: habitacionToDelete
        });
    } catch (error) {
        console.error('Error deleting habitacion:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const habitacionGet = async (req, res) => {
    try {
        const habitaciones = await Habitacion.find();

        res.status(200).json({
            habitaciones
        });
    } catch (error) {
        console.error('Error fetching habitaciones:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const habitacionById = async (req, res) => {
    try {
        const { id } = req.params;
        const total = await Habitacion.countDocuments({ hotel: id });
        // Buscar todas las habitaciones que pertenezcan al hotel con el ID proporcionado
        const habitaciones = await Habitacion.find({ hotel: id });

        if (habitaciones.length === 0) {
            return res.status(404).json({ error: 'No se encontraron habitaciones para este hotel' });
        }

        res.status(200).json({
            total,
            habitaciones
        });
    } catch (error) {
        console.error('Error fetching habitaciones by hotel ID:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
