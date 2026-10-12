package com.honestroom.repository;

import com.honestroom.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findTop20ByRoomIdOrderByCreatedAtDesc(Long roomId);

    @Modifying
    @Query("DELETE FROM ActivityLog a WHERE a.room.id = :roomId")
    void deleteAllByRoomId(@Param("roomId") Long roomId);
}
