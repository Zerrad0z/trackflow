package com.trackflow.module.form.dto;

import jakarta.validation.constraints.NotBlank;

public record InfractionStatusRequest(
        @NotBlank String statut,
        String gareReglement,
        Double montantRegle,
        String numPP
) {}
