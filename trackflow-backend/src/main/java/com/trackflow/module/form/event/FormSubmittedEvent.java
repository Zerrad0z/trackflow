package com.trackflow.module.form.event;

import java.util.UUID;

public record FormSubmittedEvent(
        UUID formId,
        UUID uploadedById,
        String formType,
        String scanUrl
) {}