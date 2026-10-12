package com.honestroom.repository;

import com.honestroom.entity.Room;
import com.honestroom.entity.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    Optional<Room> findByPublicToken(String publicToken);

    boolean existsByPublicToken(String publicToken);

    long countByOwnerId(Long ownerId);

    long countByOwnerIdAndStatus(Long ownerId, RoomStatus status);

    @Query("""
            SELECT r FROM Room r
            WHERE r.owner.id = :ownerId
              AND (:status IS NULL OR r.status = :status)
              AND (:search IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(r.description, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY r.createdAt DESC
            """)
    List<Room> searchRoomsByOwner(
            @Param("ownerId") Long ownerId,
            @Param("status") RoomStatus status,
            @Param("search") String search
    );
}
