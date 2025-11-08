import { APIURL } from "@/utils/env";
import { BookServiceForm, Services, ServicesResponse } from "../types/services";
import { toast } from "sonner";

export class ServicesClass {
    // Book Service by User 
    static async bookService(data: BookServiceForm): Promise<BookServiceForm> {
        try {
            const response = await fetch(`${APIURL}/services/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    type: data.type,
                    scheduledDate: data.scheduledDate,
                    beforeImageUrl: data.beforeImageUrl || undefined,
                    afterImageUrl: data.afterImageUrl || undefined
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Cannot create Service');
            }

            return result;
        }
        catch (error) {
            throw error;
        }
    }

    // GetAllServices 
    static async getAllServices(page: number, limit: number): Promise<ServicesResponse> {
        try {
            const response = await fetch(`${APIURL}/services?page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error('Some error occured', {
                    description: result.error || 'Cannot fetch all services',
                    action: {
                        label: 'Retry',
                        onClick: () => {
                            window.location.reload();
                        }
                    }
                });
                throw new Error(result.error || 'Cannot fetch all services');
            }

            return {
                services: result.services || result,
                pagination: result.pagination || result,
                message: result.message || result
            }
        }
        catch (error) {
            throw error;
        }
    }

    // GetServicesById
    static async getServicesById(id: string): Promise<{ message: string, service: Services }> {
        try {
            const response = await fetch(`${APIURL}/services/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Cannot fetch service with id ${id}`);
            }

            return result;
        }
        catch (error) {
            console.error('Error fetching service: ', error);
            throw error;
        }
    }

    // UpdateServiceStatus (can only done by admin, superadmin)
    static async updateServiceStatus(id: string, status: string): Promise<Services> {
        try {
            const response = await fetch(`${APIURL}/services/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ status })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || result.error || "Failed to update status");
            }

            return result;
        }
        catch (error) {
            throw error;
        }
    }

    // Delete Service
    static async deleteService(id: string): Promise<{ message: string }> {
        try {
            const response = await fetch(`${APIURL}/services/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || result.error || 'Failed to cancel service');
            }

            return result;
        }
        catch (error) {
            console.error('Error deleting service: ', error);
            throw error;
        }
    }

    static async rescheduleService(bookingId: string, slotId: string) {
        try {
            const response = await fetch(
                `${APIURL}/services/bookings/${bookingId}/reschedule`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ slotId })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 
                    result.error || 
                    'Failed to reschedule service'
                );
            }

            return result;
        } catch (error) {
            console.error('Error rescheduling service:', error);
            throw error;
        }
    }

    static async cancelService(bookingId: string, reason?: string) {
        try {
            const response = await fetch(
                `${APIURL}/services/bookings/${bookingId}/cancel`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ reason })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 
                    result.error || 
                    'Failed to cancel service'
                );
            }

            return result;
        } catch (error) {
            console.error('Error cancelling service:', error);
            throw error;
        }
    }

    static async getAvailableSlots() {
        try {
            const response = await fetch(`${APIURL}/services/slots`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 
                    result.error || 
                    'Failed to fetch available slots'
                );
            }

            return result;
        } catch (error) {
            console.error('Error fetching available slots:', error);
            throw error;
        }
    }
}