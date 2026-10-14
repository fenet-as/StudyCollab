package com.studycollab.service.notes;

import com.studycollab.dto.notes.NoteRequest;
import com.studycollab.dto.notes.NoteResponse;
import com.studycollab.exception.CustomExceptions.BadRequestException;
import com.studycollab.exception.CustomExceptions.ResourceNotFoundException;
import com.studycollab.exception.CustomExceptions.UnauthorizedException;
import com.studycollab.model.GroupMember;
import com.studycollab.model.GroupRole;
import com.studycollab.model.Note;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import com.studycollab.repository.group.GroupRepository;
import com.studycollab.repository.notes.NotesRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotesServiceTest {

    @Mock
    private NotesRepository notesRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @InjectMocks
    private NotesService notesService;

    private User ownerUser;
    private User otherUser;
    private StudyGroup group;
    private GroupMember membership;

    @BeforeEach
    void setUp() {
        ownerUser = new User();
        ReflectionTestUtils.setField(ownerUser, "id", 1L);
        ownerUser.setFullName("Note Owner");
        ownerUser.setEmail("owner@studycollab.com");

        otherUser = new User();
        ReflectionTestUtils.setField(otherUser, "id", 2L);
        otherUser.setFullName("Other User");
        otherUser.setEmail("other@studycollab.com");

        group = new StudyGroup();
        group.setId(10L);
        group.setName("Computer Science 101");
        group.setMembers(new ArrayList<>());

        membership = new GroupMember();
        membership.setId(100L);
        membership.setStudyGroup(group);
        membership.setUser(ownerUser);
        membership.setRole(GroupRole.MEMBER);
        group.getMembers().add(membership);

        lenient().when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(membership));
        lenient().when(groupMemberRepository.findByGroupIdAndUserId(10L, 2L)).thenReturn(Optional.empty());
    }

    private NoteRequest createRequest(String title, String content, Long groupId) {
        NoteRequest req = new NoteRequest();
        req.setTitle(title);
        req.setContent(content);
        req.setGroupId(groupId);
        return req;
    }

    @Nested
    @DisplayName("Get Notes By Group Tests")
    class GetNotesByGroupTests {

        @Test
        @DisplayName("Returns list of notes when user is a group member")
        void getNotesByGroup_Member_Success() {
            Note note = Note.builder()
                    .id(50L)
                    .title("Algorithm Complexity")
                    .content("Big-O notation notes")
                    .owner(ownerUser)
                    .studyGroup(group)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
            when(notesRepository.findByStudyGroupIdOrderByUpdatedAtDesc(10L)).thenReturn(List.of(note));

            List<NoteResponse> notes = notesService.getNotesByGroup(10L, ownerUser);

            assertThat(notes).hasSize(1);
            assertThat(notes.get(0).getId()).isEqualTo(50L);
            assertThat(notes.get(0).getTitle()).isEqualTo("Algorithm Complexity");
            assertThat(notes.get(0).getOwnerId()).isEqualTo(1L);
            assertThat(notes.get(0).getGroupId()).isEqualTo(10L);
        }

        @Test
        @DisplayName("Throws BadRequestException when user is not a group member")
        void getNotesByGroup_NonMember_ThrowsBadRequestException() {
            when(groupRepository.findById(10L)).thenReturn(Optional.of(group));

            assertThatThrownBy(() -> notesService.getNotesByGroup(10L, otherUser))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("not a member of group");

            verify(notesRepository, never()).findByStudyGroupIdOrderByUpdatedAtDesc(any());
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when group does not exist")
        void getNotesByGroup_GroupNotFound_ThrowsResourceNotFoundException() {
            when(groupRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notesService.getNotesByGroup(999L, ownerUser))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Study group not found with id: 999");
        }
    }

    @Nested
    @DisplayName("Create Note Tests")
    class CreateNoteTests {

        @Test
        @DisplayName("Successfully creates a note for a group member within limits")
        void createNote_GroupNote_Success() {
            NoteRequest request = createRequest("Data Structures", "Trees and Graphs", 10L);

            when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
            when(notesRepository.countByStudyGroupId(10L)).thenReturn(10L);
            when(notesRepository.save(any(Note.class))).thenAnswer(invocation -> {
                Note n = invocation.getArgument(0);
                n.setId(55L);
                return n;
            });

            NoteResponse response = notesService.createNote(request, ownerUser);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(55L);
            assertThat(response.getTitle()).isEqualTo("Data Structures");
            assertThat(response.getOwnerId()).isEqualTo(1L);
            assertThat(response.getGroupId()).isEqualTo(10L);
        }

        @Test
        @DisplayName("Throws BadRequestException when group has reached 500 notes limit")
        void createNote_CapacityExceeded_ThrowsBadRequestException() {
            NoteRequest request = createRequest("Overflow Note", "Content", 10L);

            when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
            when(notesRepository.countByStudyGroupId(10L)).thenReturn(500L);

            assertThatThrownBy(() -> notesService.createNote(request, ownerUser))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("maximum capacity of 500 notes");

            verify(notesRepository, never()).save(any());
        }

        @Test
        @DisplayName("Throws BadRequestException when non-member tries to create a group note")
        void createNote_NonMember_ThrowsBadRequestException() {
            NoteRequest request = createRequest("Forbidden Note", "Content", 10L);

            when(groupRepository.findById(10L)).thenReturn(Optional.of(group));

            assertThatThrownBy(() -> notesService.createNote(request, otherUser))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("not a member of group");

            verify(notesRepository, never()).save(any());
        }

        @Test
        @DisplayName("Successfully creates personal note without group")
        void createNote_PersonalNoteWithoutGroup_Success() {
            NoteRequest request = createRequest("Personal Checklist", "Self study items", null);

            when(notesRepository.save(any(Note.class))).thenAnswer(invocation -> {
                Note n = invocation.getArgument(0);
                n.setId(77L);
                return n;
            });

            NoteResponse response = notesService.createNote(request, ownerUser);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(77L);
            assertThat(response.getGroupId()).isNull();
            assertThat(response.getOwnerId()).isEqualTo(1L);
            verify(groupRepository, never()).findById(any());
        }
    }

    @Nested
    @DisplayName("Update Note Tests")
    class UpdateNoteTests {

        @Test
        @DisplayName("Successfully updates note when user is owner and group member")
        void updateNote_OwnerAndMember_Success() {
            Note note = Note.builder()
                    .id(60L)
                    .title("Old Title")
                    .content("Old Content")
                    .owner(ownerUser)
                    .studyGroup(group)
                    .build();

            NoteRequest request = createRequest("Updated Title", "Updated Content", null);

            when(notesRepository.findById(60L)).thenReturn(Optional.of(note));
            when(notesRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

            NoteResponse response = notesService.updateNote(60L, request, ownerUser);

            assertThat(response.getTitle()).isEqualTo("Updated Title");
            assertThat(response.getContent()).isEqualTo("Updated Content");
            assertThat(note.getTitle()).isEqualTo("Updated Title");
        }

        @Test
        @DisplayName("Throws UnauthorizedException when non-owner attempts to update note")
        void updateNote_NonOwner_ThrowsUnauthorizedException() {
            Note note = Note.builder()
                    .id(60L)
                    .title("Original Title")
                    .content("Original Content")
                    .owner(ownerUser)
                    .studyGroup(group)
                    .build();

            GroupMember otherMember = new GroupMember();
            otherMember.setStudyGroup(group);
            otherMember.setUser(otherUser);
            group.getMembers().add(otherMember);
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 2L)).thenReturn(Optional.of(otherMember));

            NoteRequest request = createRequest("Tampered Title", "Tampered Content", null);

            when(notesRepository.findById(60L)).thenReturn(Optional.of(note));

            assertThatThrownBy(() -> notesService.updateNote(60L, request, otherUser))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("do not have permission to modify or delete this note");

            verify(notesRepository, never()).save(any());
        }

        @Test
        @DisplayName("Throws BadRequestException when note owner is no longer a member of group")
        void updateNote_OwnerNoLongerMember_ThrowsBadRequestException() {
            group.getMembers().clear(); // owner removed from group
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

            Note note = Note.builder()
                    .id(60L)
                    .title("Original")
                    .content("Original")
                    .owner(ownerUser)
                    .studyGroup(group)
                    .build();

            NoteRequest request = createRequest("Update", "Update", null);

            when(notesRepository.findById(60L)).thenReturn(Optional.of(note));

            assertThatThrownBy(() -> notesService.updateNote(60L, request, ownerUser))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("not a member of group");

            verify(notesRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Delete Note Tests")
    class DeleteNoteTests {

        @Test
        @DisplayName("Successfully deletes note when caller is owner and group member")
        void deleteNote_OwnerAndMember_Success() {
            Note note = Note.builder()
                    .id(70L)
                    .title("To Delete")
                    .content("Content")
                    .owner(ownerUser)
                    .studyGroup(group)
                    .build();

            when(notesRepository.findById(70L)).thenReturn(Optional.of(note));

            notesService.deleteNote(70L, ownerUser);

            verify(notesRepository).delete(note);
        }

        @Test
        @DisplayName("Throws UnauthorizedException when non-owner attempts to delete note")
        void deleteNote_NonOwner_ThrowsUnauthorizedException() {
            Note note = Note.builder()
                    .id(70L)
                    .title("To Delete")
                    .content("Content")
                    .owner(ownerUser)
                    .studyGroup(group)
                    .build();

            GroupMember otherMember = new GroupMember();
            otherMember.setStudyGroup(group);
            otherMember.setUser(otherUser);
            group.getMembers().add(otherMember);
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 2L)).thenReturn(Optional.of(otherMember));

            when(notesRepository.findById(70L)).thenReturn(Optional.of(note));

            assertThatThrownBy(() -> notesService.deleteNote(70L, otherUser))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("do not have permission to modify or delete this note");

            verify(notesRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when note does not exist")
        void deleteNote_NotFound_ThrowsResourceNotFoundException() {
            when(notesRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notesService.deleteNote(999L, ownerUser))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Note not found with id: 999");

            verify(notesRepository, never()).delete(any());
        }
    }
}
