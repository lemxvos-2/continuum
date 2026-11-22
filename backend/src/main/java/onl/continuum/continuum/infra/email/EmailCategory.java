package onl.continuum.continuum.infra.email;

/** Every email the backend sends belongs to one category; the user's preference decides delivery. */
public enum EmailCategory {
    /** Account, security and transactional messages (welcome, deletion). */
    ESSENTIAL,
    /** Optional engagement messages (daily memories, digests, news). */
    ALL;

    public static final String PREF_NONE = "NONE";
    public static final String PREF_ESSENTIAL = "ESSENTIAL";
    public static final String PREF_ALL = "ALL";

    /** NONE blocks everything, ESSENTIAL only essentials, ALL (default, also for null) everything. */
    public static boolean allows(String preference, EmailCategory category) {
        String p = preference == null ? PREF_ALL : preference;
        return switch (p) {
            case PREF_NONE -> false;
            case PREF_ESSENTIAL -> category == ESSENTIAL;
            default -> true;
        };
    }
}
