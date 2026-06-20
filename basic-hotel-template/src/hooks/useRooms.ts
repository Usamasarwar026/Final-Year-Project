// hooks/useRooms.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { roomApiService, type RoomFilters } from '@/services/roomApiService';
import type { Room } from '@/constant/constant';

export const ROOMS_QUERY_KEY = 'rooms';

export function useRooms(filters: RoomFilters = {}) {
  const queryClient = useQueryClient();

  const roomsQuery = useQuery({
    queryKey: [ROOMS_QUERY_KEY, filters],
    queryFn: () => roomApiService.getRooms(filters),
    placeholderData: keepPreviousData, // no flash on page/filter change
    staleTime: 30_000,                 // 30s fresh — no redundant refetches
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const createRoomMutation = useMutation({
    mutationFn: roomApiService.createRoom,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ROOMS_QUERY_KEY] });
      toast.success(`Room ${data.room.room_number} created successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create room');
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Room> }) =>
      roomApiService.updateRoom(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ROOMS_QUERY_KEY] });
      toast.success(`Room ${data.room.room_number} updated successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update room');
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: roomApiService.deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROOMS_QUERY_KEY] });
      toast.success('Room deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete room');
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: roomApiService.uploadPhoto,
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload photo');
    },
  });

  return {
    rooms: roomsQuery.data?.rooms || [],
    pagination: roomsQuery.data?.pagination,
    isLoading: roomsQuery.isLoading,
    isFetching: roomsQuery.isFetching,
    error: roomsQuery.error,

    createRoom: async (data: Omit<Room, 'room_id' | 'created_at' | 'updated_at'>) => {
      try {
        const result = await createRoomMutation.mutateAsync(data);
        return { ok: true, room: result.room };
      } catch {
        return { ok: false };
      }
    },

    updateRoom: async (id: number, data: Partial<Room>) => {
      try {
        const result = await updateRoomMutation.mutateAsync({ id, data });
        return { ok: true, room: result.room };
      } catch {
        return { ok: false };
      }
    },

    deleteRoom: async (id: number) => {
      try {
        await deleteRoomMutation.mutateAsync(id);
        return { ok: true };
      } catch {
        return { ok: false };
      }
    },

    uploadPhoto: async (file: File) => {
      try {
        const result = await uploadPhotoMutation.mutateAsync(file);
        return { ok: true, url: result.url };
      } catch (error: any) {
        return { ok: false, error: error.response?.data?.error || 'Upload failed' };
      }
    },

    isCreating: createRoomMutation.isPending,
    isUpdating: updateRoomMutation.isPending,
    isDeleting: deleteRoomMutation.isPending,
    isUploading: uploadPhotoMutation.isPending,

    refetch: () => roomsQuery.refetch(),
  };
}