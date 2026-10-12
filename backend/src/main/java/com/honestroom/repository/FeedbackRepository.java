package com.honestroom.repository;

import com.honestroom.entity.Feedback;
import com.honestroom.entity.FeedbackCategory;
import com.honestroom.entity.FeedbackStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    @Query("""
            SELECT f FROM Feedback f
            WHERE f.room.id = :roomId
              AND (:status IS NULL OR f.status = :status)
              AND (:category IS NULL OR f.category = :category)
              AND (:search IS NULL OR LOWER(f.message) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Feedback> findByRoomWithFilters(
            @Param("roomId") Long roomId,
            @Param("status") FeedbackStatus status,
            @Param("category") FeedbackCategory category,
            @Param("search") String search,
            Pageable pageable
    );

    long countByRoomId(Long roomId);

    long countByRoomIdAndStatus(Long roomId, FeedbackStatus status);

    long countByRoomIdAndCategory(Long roomId, FeedbackCategory category);

    long countByRoomOwnerId(Long ownerId);

    long countByRoomOwnerIdAndStatus(Long ownerId, FeedbackStatus status);

    long countByRoomOwnerIdAndCategory(Long ownerId, FeedbackCategory category);

    @Query("""
            SELECT f FROM Feedback f
            JOIN FETCH f.room r
            WHERE r.owner.id = :ownerId
            ORDER BY f.createdAt DESC
            """)
    List<Feedback> findRecentByOwnerId(@Param("ownerId") Long ownerId, Pageable pageable);

    @Modifying
    @Query("DELETE FROM Feedback f WHERE f.room.id = :roomId")
    void deleteAllByRoomId(@Param("roomId") Long roomId);
}
