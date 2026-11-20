package onl.continuum.continuum.controller;

import onl.continuum.continuum.application.exception.BadRequestException;
import onl.continuum.continuum.application.exception.NotFoundException;
import onl.continuum.continuum.application.exception.PlanLimitException;
import onl.continuum.continuum.domain.entity.Entity;
import onl.continuum.continuum.domain.note.Note;
import onl.continuum.continuum.domain.plan.PlanType;
import onl.continuum.continuum.domain.workspace.Workspace;
import onl.continuum.continuum.infra.persistence.EntityRepository;
import onl.continuum.continuum.infra.persistence.NoteRepository;
import onl.continuum.continuum.infra.persistence.WorkspaceRepository;
import onl.continuum.continuum.infra.security.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private static final int FREE_WORKSPACE_LIMIT = 1;

    private final WorkspaceRepository repo;
    private final NoteRepository noteRepo;
    private final EntityRepository entityRepo;

    public WorkspaceController(WorkspaceRepository repo, NoteRepository noteRepo, EntityRepository entityRepo) {
        this.repo = repo;
        this.noteRepo = noteRepo;
        this.entityRepo = entityRepo;
    }

    public record WorkspaceRequest(String name, String color, String icon) {}
    public record AssignRequest(String kind, String id, List<String> workspaceIds) {}
    public record BulkAssignRequest(String kind, List<String> ids, List<String> workspaceIds, String operation) {}

    @GetMapping
    public List<Workspace> list(@AuthenticationPrincipal CustomUserDetails user) {
        return repo.findByUserIdOrderByCreatedAtAsc(user.getUserId());
    }

    @PostMapping
    public ResponseEntity<Workspace> create(@AuthenticationPrincipal CustomUserDetails user, @RequestBody WorkspaceRequest req) {
        String name = req.name() == null ? "" : req.name().trim();
        if (name.isEmpty() || name.length() > 60) throw new BadRequestException("Invalid workspace name");
        if (user.getPlan() != PlanType.VISION
                && repo.findByUserIdOrderByCreatedAtAsc(user.getUserId()).size() >= FREE_WORKSPACE_LIMIT)
            throw new PlanLimitException("Free plan allows one custom workspace. Upgrade to VISION for unlimited workspaces.");
        Workspace ws = Workspace.builder()
                .userId(user.getUserId()).name(name).color(req.color()).icon(req.icon())
                .createdAt(Instant.now()).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(ws));
    }

    @PutMapping("/{id}")
    public Workspace update(@AuthenticationPrincipal CustomUserDetails user, @PathVariable String id, @RequestBody WorkspaceRequest req) {
        Workspace ws = owned(user, id);
        if (req.name() != null) {
            String name = req.name().trim();
            if (name.isEmpty() || name.length() > 60) throw new BadRequestException("Invalid workspace name");
            ws.setName(name);
        }
        if (req.color() != null) ws.setColor(req.color());
        if (req.icon() != null) ws.setIcon(req.icon());
        return repo.save(ws);
    }

    /** Deletes the workspace only; notes and entities stay and remain visible in "All". */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal CustomUserDetails user, @PathVariable String id) {
        Workspace ws = owned(user, id);
        List<Note> notes = noteRepo.findByUserId(user.getUserId());
        List<Note> changedNotes = new ArrayList<>();
        for (Note n : notes) {
            if (n.getWorkspaceIds() != null && n.getWorkspaceIds().remove(id)) changedNotes.add(n);
        }
        noteRepo.saveAll(changedNotes);
        // Include archived entities so a later restore does not bring back a dangling workspace id.
        List<Entity> entities = entityRepo.findByUserId(user.getUserId());
        List<Entity> changedEntities = new ArrayList<>();
        for (Entity e : entities) {
            if (e.getWorkspaceIds() != null && e.getWorkspaceIds().remove(id)) changedEntities.add(e);
        }
        entityRepo.saveAll(changedEntities);
        repo.delete(ws);
        return ResponseEntity.noContent().build();
    }

    /** Sets which workspaces a note or entity belongs to (shared when more than one). */
    @PutMapping("/assign")
    public ResponseEntity<Map<String, Object>> assign(@AuthenticationPrincipal CustomUserDetails user, @RequestBody AssignRequest req) {
        Set<String> valid = new HashSet<>();
        repo.findByUserIdOrderByCreatedAtAsc(user.getUserId()).forEach(w -> valid.add(w.getId()));
        valid.add(onl.continuum.continuum.infra.web.RequestWorkspace.MAIN);
        List<String> ids = new ArrayList<>(new LinkedHashSet<>(req.workspaceIds() == null ? List.of() : req.workspaceIds()));
        ids.removeIf(i -> !valid.contains(i));
        // Only in Main is the same as no explicit workspace.
        if (ids.size() == 1 && ids.get(0).equals(onl.continuum.continuum.infra.web.RequestWorkspace.MAIN)) ids.clear();

        if ("NOTE".equalsIgnoreCase(req.kind())) {
            Note n = noteRepo.findById(req.id())
                    .filter(x -> user.getUserId().equals(x.getUserId()))
                    .orElseThrow(() -> new NotFoundException("Note not found"));
            n.setWorkspaceIds(ids);
            noteRepo.save(n);
        } else if ("ENTITY".equalsIgnoreCase(req.kind())) {
            Entity e = entityRepo.findById(req.id())
                    .filter(x -> user.getUserId().equals(x.getUserId()))
                    .orElseThrow(() -> new NotFoundException("Entity not found"));
            e.setWorkspaceIds(ids);
            entityRepo.save(e);
        } else {
            throw new BadRequestException("kind must be NOTE or ENTITY");
        }
        return ResponseEntity.ok(Map.of("id", req.id(), "workspaceIds", ids));
    }

    @PutMapping("/assign/bulk")
    public ResponseEntity<Map<String, Integer>> assignBulk(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody BulkAssignRequest req) {
        List<String> ids = distinctIds(req.ids());
        String operation = req.operation() == null ? "" : req.operation().toUpperCase(Locale.ROOT);
        if (!"ADD".equals(operation) && !"MOVE".equals(operation)) {
            throw new BadRequestException("operation must be ADD or MOVE");
        }
        List<String> workspaceIds = distinctWorkspaceIds(req.workspaceIds(), user);

        if ("NOTE".equalsIgnoreCase(req.kind())) {
            List<Note> notes = noteRepo.findAllById(ids);
            requireOwnedItems(notes.size(), ids.size(), notes.stream().anyMatch(n -> !user.getUserId().equals(n.getUserId())));
            notes.forEach(note -> note.setWorkspaceIds(updatedWorkspaceIds(note.getWorkspaceIds(), workspaceIds, operation)));
            noteRepo.saveAll(notes);
            return ResponseEntity.ok(Map.of("updatedCount", notes.size()));
        }
        if ("ENTITY".equalsIgnoreCase(req.kind())) {
            List<Entity> entities = entityRepo.findByIdInAndArchivedAtIsNull(ids);
            requireOwnedItems(entities.size(), ids.size(), entities.stream().anyMatch(e -> !user.getUserId().equals(e.getUserId())));
            entities.forEach(entity -> entity.setWorkspaceIds(updatedWorkspaceIds(entity.getWorkspaceIds(), workspaceIds, operation)));
            entityRepo.saveAll(entities);
            return ResponseEntity.ok(Map.of("updatedCount", entities.size()));
        }
        throw new BadRequestException("kind must be NOTE or ENTITY");
    }

    private List<String> distinctIds(List<String> ids) {
        if (ids == null || ids.isEmpty() || ids.stream().anyMatch(id -> id == null || id.isBlank())) {
            throw new BadRequestException("ids is required");
        }
        return new ArrayList<>(new LinkedHashSet<>(ids));
    }

    private List<String> distinctWorkspaceIds(List<String> workspaceIds, CustomUserDetails user) {
        if (workspaceIds == null || workspaceIds.isEmpty()
                || workspaceIds.stream().anyMatch(id -> id == null || id.isBlank())) {
            throw new BadRequestException("workspaceIds is required");
        }
        List<String> ids = new ArrayList<>(new LinkedHashSet<>(workspaceIds));
        Set<String> valid = new HashSet<>();
        repo.findByUserIdOrderByCreatedAtAsc(user.getUserId()).forEach(workspace -> valid.add(workspace.getId()));
        valid.add(onl.continuum.continuum.infra.web.RequestWorkspace.MAIN);
        if (ids.stream().anyMatch(id -> !valid.contains(id))) throw new NotFoundException("Workspace not found");
        return ids;
    }

    private void requireOwnedItems(int found, int requested, boolean containsForeignItem) {
        if (found != requested || containsForeignItem) throw new NotFoundException("Item not found");
    }

    private List<String> updatedWorkspaceIds(List<String> current, List<String> selected, String operation) {
        LinkedHashSet<String> next = "MOVE".equals(operation)
                ? new LinkedHashSet<>()
                : new LinkedHashSet<>(current == null || current.isEmpty()
                        ? List.of(onl.continuum.continuum.infra.web.RequestWorkspace.MAIN)
                        : current);
        next.addAll(selected);
        if (next.size() == 1 && next.contains(onl.continuum.continuum.infra.web.RequestWorkspace.MAIN)) {
            return new ArrayList<>();
        }
        return new ArrayList<>(next);
    }

    private Workspace owned(CustomUserDetails user, String id) {
        return repo.findByIdAndUserId(id, user.getUserId())
                .orElseThrow(() -> new NotFoundException("Workspace not found"));
    }
}
