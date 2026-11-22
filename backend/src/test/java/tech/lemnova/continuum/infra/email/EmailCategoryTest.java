package onl.continuum.continuum.infra.email;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class EmailCategoryTest {
    @Test void noneBlocksEverything() {
        assertThat(EmailCategory.allows("NONE", EmailCategory.ESSENTIAL)).isFalse();
        assertThat(EmailCategory.allows("NONE", EmailCategory.ALL)).isFalse();
    }
    @Test void essentialOnlyAllowsEssential() {
        assertThat(EmailCategory.allows("ESSENTIAL", EmailCategory.ESSENTIAL)).isTrue();
        assertThat(EmailCategory.allows("ESSENTIAL", EmailCategory.ALL)).isFalse();
    }
    @Test void allAndDefaultAllowEverything() {
        assertThat(EmailCategory.allows("ALL", EmailCategory.ALL)).isTrue();
        assertThat(EmailCategory.allows(null, EmailCategory.ALL)).isTrue();
    }
}
