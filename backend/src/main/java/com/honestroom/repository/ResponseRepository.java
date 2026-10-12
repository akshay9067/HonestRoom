package com.honestroom.repository;

import com.honestroom.entity.FeedbackResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResponseRepository extends JpaRepository<FeedbackResponse, Long> {

    Optional<FeedbackResponse> findByFeedbackId(Long feedbackId);

    List<FeedbackResponse> findByFeedbackIdIn(Collection<Long> feedbackIds);

    boolean existsByFeedbackId(Long feedbackId);

    @Modifying
    @Query("DELETE FROM FeedbackResponse r WHERE r.feedback.id = :feedbackId")
    void deleteByFeedbackId(@Param("feedbackId") Long feedbackId);

    @Modifying
    @Query("DELETE FROM FeedbackResponse r WHERE r.feedback.room.id = :roomId")
    void deleteAllByRoomId(@Param("roomId") Long roomId);
}
