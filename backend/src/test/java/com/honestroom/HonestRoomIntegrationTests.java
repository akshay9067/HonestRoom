package com.honestroom;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.honestroom.dto.ChangePasswordRequest;
import com.honestroom.dto.CreateRoomRequest;
import com.honestroom.dto.LoginRequest;
import com.honestroom.dto.RegisterRequest;
import com.honestroom.dto.SubmitFeedbackRequest;
import com.honestroom.dto.UpdateFeedbackStatusRequest;
import com.honestroom.dto.UpdateProfileRequest;
import com.honestroom.dto.UpdateRoomRequest;
import com.honestroom.dto.UpdateRoomStatusRequest;
import com.honestroom.dto.UpsertResponseRequest;
import com.honestroom.entity.FeedbackCategory;
import com.honestroom.entity.FeedbackStatus;
import com.honestroom.entity.RoomStatus;
import com.honestroom.entity.User;
import com.honestroom.repository.FeedbackRepository;
import com.honestroom.repository.ResponseRepository;
import com.honestroom.repository.RoomRepository;
import com.honestroom.repository.UserRepository;
import com.honestroom.service.RateLimiterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HonestRoomIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private ResponseRepository responseRepository;

    @Autowired
    private RateLimiterService rateLimiterService;

    @BeforeEach
    void cleanDatabase() {
        rateLimiterService.clearAll();
        responseRepository.deleteAll();
        feedbackRepository.deleteAll();
        roomRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("1-4: Registration, BCrypt password hashing, duplicate email rejection, login, and profile management")
    void registrationLoginAndPasswordHashingFlow() throws Exception {
        RegisterRequest registerReq = new RegisterRequest("Elena Vance", "elena@honestroom.org", "StrongPass#2026");

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.name").value("Elena Vance"))
                .andExpect(jsonPath("$.user.email").value("elena@honestroom.org"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andReturn();

        // Verify BCrypt hash in database
        User savedUser = userRepository.findByEmailIgnoreCase("elena@honestroom.org").orElseThrow();
        assertThat(savedUser.getPasswordHash()).isNotEqualTo("StrongPass#2026");
        assertThat(savedUser.getPasswordHash()).startsWith("$2a$");

        // Duplicate email must fail with 409 Conflict
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account with this email address already exists."));

        // Invalid login credentials must fail with 401 Unauthorized
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("elena@honestroom.org", "WrongPassword!"))))
                .andExpect(status().isUnauthorized());

        // Valid login succeeds
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("elena@honestroom.org", "StrongPass#2026"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();

        String token = extractToken(loginResult);

        // Update profile and change password
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateProfileRequest("Elena V. Updated"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Elena V. Updated"));

        mockMvc.perform(put("/api/users/me/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangePasswordRequest("StrongPass#2026", "NewStrongPass#2027"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("5-8: Room creation, ownership authorization, updates, deletion, and public room lookup")
    void roomCrudAndOwnershipAuthorization() throws Exception {
        String owner1Token = registerAndGetToken("Owner One", "owner1@honestroom.org", "Password123!");
        String owner2Token = registerAndGetToken("Owner Two", "owner2@honestroom.org", "Password123!");

        // Owner 1 creates a room
        CreateRoomRequest createReq = new CreateRoomRequest(
                "Q4 Engineering Retrospective",
                "Share honest feedback about our sprint rituals and deployment pipeline.",
                RoomStatus.OPEN
        );
        MvcResult createRoomRes = mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("Q4 Engineering Retrospective"))
                .andExpect(jsonPath("$.publicToken").isNotEmpty())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andReturn();

        JsonNode roomNode = objectMapper.readTree(createRoomRes.getResponse().getContentAsString());
        long roomId = roomNode.get("id").asLong();
        String publicToken = roomNode.get("publicToken").asText();

        // Public room lookup exposes only public fields, not internal ID or owner info
        mockMvc.perform(get("/api/public/rooms/" + publicToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Q4 Engineering Retrospective"))
                .andExpect(jsonPath("$.publicToken").value(publicToken))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.owner").doesNotExist());

        // Owner 2 cannot view, edit, change status, or delete Owner 1's room (403 Forbidden)
        mockMvc.perform(get("/api/rooms/" + roomId)
                        .header("Authorization", "Bearer " + owner2Token))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/rooms/" + roomId)
                        .header("Authorization", "Bearer " + owner2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateRoomRequest("Hijacked Title", "Desc", RoomStatus.OPEN))))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/rooms/" + roomId)
                        .header("Authorization", "Bearer " + owner2Token))
                .andExpect(status().isForbidden());

        // Owner 1 updates room
        mockMvc.perform(put("/api/rooms/" + roomId)
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateRoomRequest(
                                "Q4 Engineering Retro (Updated)",
                                "Updated description",
                                RoomStatus.OPEN
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Q4 Engineering Retro (Updated)"));

        // Owner 1 deletes room
        mockMvc.perform(delete("/api/rooms/" + roomId)
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/rooms/" + roomId)
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("9-15: Anonymous feedback submission, closed room rejection, validation, feedback management, responses, and dashboard stats")
    void anonymousFeedbackResponsesAndDashboardLifecycle() throws Exception {
        String owner1Token = registerAndGetToken("Club President", "president@club.edu", "Password123!");
        String owner2Token = registerAndGetToken("Other User", "other@club.edu", "Password123!");

        // Create room
        MvcResult roomRes = mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateRoomRequest(
                                "Annual Hackathon Feedback",
                                "Tell us what worked well and what we should improve next year.",
                                RoomStatus.OPEN
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode roomJson = objectMapper.readTree(roomRes.getResponse().getContentAsString());
        long roomId = roomJson.get("id").asLong();
        String publicToken = roomJson.get("publicToken").asText();

        // Validation: Empty message rejected (400 Bad Request)
        mockMvc.perform(post("/api/public/rooms/" + publicToken + "/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SubmitFeedbackRequest("   ", FeedbackCategory.SUGGESTION, null))))
                .andExpect(status().isBadRequest());

        // Validation: Oversized message (> 5000 chars) rejected (400 Bad Request)
        String oversized = "A".repeat(5005);
        mockMvc.perform(post("/api/public/rooms/" + publicToken + "/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SubmitFeedbackRequest(oversized, FeedbackCategory.CONCERN, null))))
                .andExpect(status().isBadRequest());

        // Submit 2 valid anonymous feedback items without authentication
        mockMvc.perform(post("/api/public/rooms/" + publicToken + "/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SubmitFeedbackRequest(
                                "More power strips at the hardware tables would be super helpful!",
                                FeedbackCategory.SUGGESTION,
                                null
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.submitted").value(true));

        mockMvc.perform(post("/api/public/rooms/" + publicToken + "/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SubmitFeedbackRequest(
                                "The mentorship sessions were fantastic this year.",
                                FeedbackCategory.APPRECIATION,
                                null
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.submitted").value(true));

        // Close the room and verify new submissions are rejected
        mockMvc.perform(patch("/api/rooms/" + roomId + "/status")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateRoomStatusRequest(RoomStatus.CLOSED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));

        mockMvc.perform(post("/api/public/rooms/" + publicToken + "/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SubmitFeedbackRequest(
                                "Late submission after room closed",
                                FeedbackCategory.GENERAL,
                                null
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This feedback room is currently closed and not accepting new submissions."));

        // Cross-owner feedback access prevented (Owner 2 gets 403 Forbidden)
        mockMvc.perform(get("/api/rooms/" + roomId + "/feedback")
                        .header("Authorization", "Bearer " + owner2Token))
                .andExpect(status().isForbidden());

        // Owner 1 retrieves feedback list
        MvcResult feedbackListRes = mockMvc.perform(get("/api/rooms/" + roomId + "/feedback")
                        .header("Authorization", "Bearer " + owner1Token)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andReturn();

        JsonNode pageJson = objectMapper.readTree(feedbackListRes.getResponse().getContentAsString());
        long feedbackId = pageJson.get("content").get(0).get("id").asLong();

        // Owner 2 cannot update feedback status or add a response
        mockMvc.perform(patch("/api/feedback/" + feedbackId + "/status")
                        .header("Authorization", "Bearer " + owner2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateFeedbackStatusRequest(FeedbackStatus.RESOLVED))))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/feedback/" + feedbackId + "/responses")
                        .header("Authorization", "Bearer " + owner2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpsertResponseRequest("Unauthorized response"))))
                .andExpect(status().isForbidden());

        // Owner 1 creates a private response
        MvcResult responseRes = mockMvc.perform(post("/api/feedback/" + feedbackId + "/responses")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpsertResponseRequest(
                                "Thank you! We have ordered 20 additional power strips for the next event."
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.feedbackId").value(feedbackId))
                .andReturn();

        long responseId = objectMapper.readTree(responseRes.getResponse().getContentAsString()).get("id").asLong();

        // Duplicate response for same feedback rejected with 409 Conflict
        mockMvc.perform(post("/api/feedback/" + feedbackId + "/responses")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpsertResponseRequest("Second response"))))
                .andExpect(status().isConflict());

        // Owner 1 updates response
        mockMvc.perform(put("/api/responses/" + responseId)
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpsertResponseRequest(
                                "Updated: 30 power strips ordered for all hardware tables."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Updated: 30 power strips ordered for all hardware tables."));

        // Owner 1 marks feedback as RESOLVED
        mockMvc.perform(patch("/api/feedback/" + feedbackId + "/status")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateFeedbackStatusRequest(FeedbackStatus.RESOLVED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));

        // Dashboard statistics reflect real saved records
        mockMvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRooms").value(1))
                .andExpect(jsonPath("$.openRooms").value(0))
                .andExpect(jsonPath("$.closedRooms").value(1))
                .andExpect(jsonPath("$.totalFeedback").value(2))
                .andExpect(jsonPath("$.resolvedFeedback").value(1))
                .andExpect(jsonPath("$.pendingFeedback").value(1));

        // Owner 1 deletes response and feedback
        mockMvc.perform(delete("/api/responses/" + responseId)
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/feedback/" + feedbackId)
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isNoContent());
    }

    private String registerAndGetToken(String name, String email, String password) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(name, email, password))))
                .andExpect(status().isCreated())
                .andReturn();
        return extractToken(res);
    }

    private String extractToken(MvcResult result) throws Exception {
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("accessToken").asText();
    }
}
