// hooks/useRooms.ts (updated with better error handling)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { roomApiService, type RoomFilters } from '@/services/roomApiService';
import type { Room } from '@/constant/constant';

export const ROOMS_QUERY_KEY = 'rooms';

export function useRooms(filters: RoomFilters = {}) {
  const queryClient = useQueryClient();

  // Query for fetching rooms with pagination
  const roomsQuery = useQuery({
    queryKey: [ROOMS_QUERY_KEY, filters],
    queryFn: () => roomApiService.getRooms(filters),
    staleTime: 30 * 1000, // 30 seconds
    keepPreviousData: true,
    retry: 1,
    retryDelay: 1000,
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: roomApiService.createRoom,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ROOMS_QUERY_KEY] });
      toast.success(`Room ${data.room.room_number} created successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to create room';
      toast.error(message);
    },
  });

  // Update room mutation
  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Room> }) =>
      roomApiService.updateRoom(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ROOMS_QUERY_KEY] });
      toast.success(`Room ${data.room.room_number} updated successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to update room';
      toast.error(message);
    },
  });

  // Delete room mutation
  const deleteRoomMutation = useMutation({
    mutationFn: roomApiService.deleteRoom,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ROOMS_QUERY_KEY] });
      toast.success('Room deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to delete room';
      toast.error(message);
    },
  });

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: roomApiService.uploadPhoto,
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to upload photo';
      toast.error(message);
    },
  });

  return {
    // Data
    rooms: roomsQuery.data?.rooms || [],
    pagination: roomsQuery.data?.pagination,
    isLoading: roomsQuery.isLoading,
    isFetching: roomsQuery.isFetching,
    error: roomsQuery.error,
    
    // Actions
    createRoom: async (data: Omit<Room, 'room_id' | 'created_at' | 'updated_at'>) => {
      try {
        const result = await createRoomMutation.mutateAsync(data);
        return { ok: true, room: result.room };
      } catch (error) {
        return { ok: false, error };
      }
    },
    
    updateRoom: async (id: number, data: Partial<Room>) => {
      try {
        const result = await updateRoomMutation.mutateAsync({ id, data });
        return { ok: true, room: result.room };
      } catch (error) {
        return { ok: false, error };
      }
    },
    
    deleteRoom: async (id: number) => {
      try {
        await deleteRoomMutation.mutateAsync(id);
        return { ok: true };
      } catch (error) {
        return { ok: false, error };
      }
    },
    
    uploadPhoto: async (file: File) => {
      try {
        const result = await uploadPhotoMutation.mutateAsync(file);
        return { ok: true, url: result.url };
      } catch (error) {
        return { ok: false, error };
      }
    },
    
    // Mutations loading states
    isCreating: createRoomMutation.isPending,
    isUpdating: updateRoomMutation.isPending,
    isDeleting: deleteRoomMutation.isPending,
    isUploading: uploadPhotoMutation.isPending,
    
    // Refetch
    refetch: () => roomsQuery.refetch(),
  };
}