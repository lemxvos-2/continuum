package onl.continuum.continuum.controller;

import onl.continuum.continuum.application.exception.PlanLimitException;
import onl.continuum.continuum.domain.plan.PlanType;
import onl.continuum.continuum.domain.user.User;
import onl.continuum.continuum.domain.workspace.Workspace;
import onl.continuum.continuum.domain.entity.Entity;
import onl.continuum.continuum.domain.note.Note;
import onl.continuum.continuum.infra.persistence.EntityRepository;
import onl.continuum.continuum.infra.persistence.NoteRepository;
import onl.continuum.continuum.infra.persistence.WorkspaceRepository;
import onl.continuum.continuum.infra.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkspaceControllerTest {

    @Mock
    private WorkspaceRepository workspaceRepository;
    @Mock
    private NoteRepository noteRepository;
    @Mock
    private EntityRepository entityRepository;

    private WorkspaceController controller;

    @BeforeEach
    void setUp() {
        controller = new WorkspaceController(workspaceRepository, noteRepository, entityRepository);
    }

    @Test
    void freeUsersCanCreateOneCustomWorkspace() {
        CustomUserDetails user = userWithPlan(PlanType.FREE);
        when(workspaceRepository.findByUserIdOrderByCreatedAtAsc("user-1")).thenReturn(List.of());
        when(workspaceRepository.save(any(Workspace.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Workspace workspace = controller.create(user, new WorkspaceController.WorkspaceRequest("Personal", "#123456", null)).getBody();

        assertThat(workspace).isNotNull();
        assertThat(workspace.getName()).isEqualTo("Personal");
        verify(workspaceRepository).save(any(Workspace.class));
    }

    @Test
    void freeUsersCannotCreateMoreThanOneCustomWorkspace() {
        CustomUserDetails user = userWithPlan(PlanType.FREE);
        when(workspaceRepository.findByUserIdOrderByCreatedAtAsc("user-1"))
                .thenReturn(List.of(Workspace.builder().name("Personal").build()));

        assertThatThrownBy(() -> controller.create(
                user,
                new WorkspaceController.WorkspaceRequest("Work", "#123456", null)
        )).isInstanceOf(PlanLimitException.class);
        verify(workspaceRepository, never()).save(any());
    }

    @Test
    void visionUsersCanCreateUnlimitedWorkspaces() {
        CustomUserDetails user = userWithPlan(PlanType.VISION);
        when(workspaceRepository.findByUserIdOrderByCreatedAtAsc("user-1"))
                .thenReturn(List.of(Workspace.builder().name("Personal").build()));
        when(workspaceRepository.save(any(Workspace.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Workspace workspace = controller.create(user, new WorkspaceController.WorkspaceRequest("Work", "#123456", null)).getBody();

        assertThat(workspace).isNotNull();
        assertThat(workspace.getName()).isEqualTo("Work");
        verify(workspaceRepository).save(any(Workspace.class));
    }

    @Test
    void bulkAddPreservesExistingNoteWorkspaces() {
        CustomUserDetails user = userWithPlan(PlanType.FREE);
        Workspace destination = Workspace.builder().id("workspace-2").userId("user-1").name("Studies").build();
        Workspace otherDestination = Workspace.builder().id("workspace-3").userId("user-1").name("Work").build();
        Note note = new Note();
        note.setId("note-1");
        note.setUserId("user-1");
        note.setWorkspaceIds(List.of("workspace-1"));
        when(workspaceRepository.findByUserIdOrderByCreatedAtAsc("user-1")).thenReturn(List.of(destination, otherDestination));
        when(noteRepository.findAllById(List.of("note-1"))).thenReturn(List.of(note));
        when(noteRepository.saveAll(List.of(note))).thenReturn(List.of(note));

        controller.assignBulk(user, new WorkspaceController.BulkAssignRequest(
                "NOTE", List.of("note-1"), List.of("workspace-2", "workspace-3"), "ADD"));

        assertThat(note.getWorkspaceIds()).containsExactly("workspace-1", "workspace-2", "workspace-3");
        verify(noteRepository).saveAll(List.of(note));
    }

    @Test
    void bulkMoveToMainClearsCustomEntityWorkspaces() {
        CustomUserDetails user = userWithPlan(PlanType.FREE);
        Entity entity = Entity.builder()
                .id("entity-1")
                .userId("user-1")
                .workspaceIds(List.of("workspace-1"))
                .build();
        when(entityRepository.findByIdInAndArchivedAtIsNull(List.of("entity-1"))).thenReturn(List.of(entity));
        when(entityRepository.saveAll(List.of(entity))).thenReturn(List.of(entity));

        controller.assignBulk(user, new WorkspaceController.BulkAssignRequest(
                "ENTITY", List.of("entity-1"), List.of("main"), "MOVE"));

        assertThat(entity.getWorkspaceIds()).isEmpty();
        verify(entityRepository).saveAll(List.of(entity));
    }

    @Test
    void bulkMoveReplacesCurrentAssignmentsWithMultipleWorkspaces() {
        CustomUserDetails user = userWithPlan(PlanType.FREE);
        Workspace destination = Workspace.builder().id("workspace-2").userId("user-1").name("Studies").build();
        Workspace otherDestination = Workspace.builder().id("workspace-3").userId("user-1").name("Work").build();
        Entity entity = Entity.builder()
                .id("entity-1")
                .userId("user-1")
                .workspaceIds(List.of("workspace-1"))
                .build();
        when(workspaceRepository.findByUserIdOrderByCreatedAtAsc("user-1")).thenReturn(List.of(destination, otherDestination));
        when(entityRepository.findByIdInAndArchivedAtIsNull(List.of("entity-1"))).thenReturn(List.of(entity));
        when(entityRepository.saveAll(List.of(entity))).thenReturn(List.of(entity));

        controller.assignBulk(user, new WorkspaceController.BulkAssignRequest(
                "ENTITY", List.of("entity-1"), List.of("workspace-2", "workspace-3"), "MOVE"));

        assertThat(entity.getWorkspaceIds()).containsExactly("workspace-2", "workspace-3");
    }

    @Test
    void bulkAddToCustomWorkspaceKeepsImplicitMainMembership() {
        CustomUserDetails user = userWithPlan(PlanType.FREE);
        Workspace destination = Workspace.builder().id("workspace-2").userId("user-1").name("Studies").build();
        when(workspaceRepository.findByUserIdOrderByCreatedAtAsc("user-1")).thenReturn(List.of(destination));
        Note note = new Note();
        note.setId("note-1");
        note.setUserId("user-1");
        when(noteRepository.findAllById(List.of("note-1"))).thenReturn(List.of(note));
        when(noteRepository.saveAll(List.of(note))).thenReturn(List.of(note));

        controller.assignBulk(user, new WorkspaceController.BulkAssignRequest(
                "NOTE", List.of("note-1"), List.of("workspace-2"), "ADD"));

        assertThat(note.getWorkspaceIds()).containsExactly("main", "workspace-2");
    }

    @Test
    void bulkAddToMainPreservesCustomWorkspaceMembership() {
        CustomUserDetails user = userWithPlan(PlanType.FREE);
        Entity entity = Entity.builder()
                .id("entity-1")
                .userId("user-1")
                .workspaceIds(List.of("workspace-1"))
                .build();
        when(entityRepository.findByIdInAndArchivedAtIsNull(List.of("entity-1"))).thenReturn(List.of(entity));
        when(entityRepository.saveAll(List.of(entity))).thenReturn(List.of(entity));

        controller.assignBulk(user, new WorkspaceController.BulkAssignRequest(
                "ENTITY", List.of("entity-1"), List.of("main"), "ADD"));

        assertThat(entity.getWorkspaceIds()).containsExactly("workspace-1", "main");
    }

    @Test
    void bulkAssignmentRejectsItemsOwnedByAnotherUserWithoutSaving() {
        CustomUserDetails user = userWithPlan(PlanType.FREE);
        Note note = new Note();
        note.setId("note-1");
        note.setUserId("another-user");
        when(noteRepository.findAllById(List.of("note-1"))).thenReturn(List.of(note));

        assertThatThrownBy(() -> controller.assignBulk(user, new WorkspaceController.BulkAssignRequest(
                "NOTE", List.of("note-1"), List.of("main"), "MOVE")))
                .isInstanceOf(onl.continuum.continuum.application.exception.NotFoundException.class);
        verify(noteRepository, never()).saveAll(anyIterable());
    }

    private CustomUserDetails userWithPlan(PlanType plan) {
        return new CustomUserDetails(User.builder()
                .id("user-1")
                .username("test-user")
                .email("test@example.com")
                .password("password")
                .role("USER")
                .active(true)
                .plan(plan)
                .build());
    }
}
