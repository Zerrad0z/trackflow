CREATE TABLE form_field_schemas (
                                    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    form_type   form_type NOT NULL,
                                    field_name  VARCHAR(100) NOT NULL,
                                    field_label VARCHAR(200) NOT NULL,
                                    field_type  VARCHAR(50) NOT NULL DEFAULT 'text',
                                    is_required BOOLEAN NOT NULL DEFAULT true,
                                    sort_order  INTEGER NOT NULL DEFAULT 0
);

-- RAPPORT_M fields
INSERT INTO form_field_schemas (form_type, field_name, field_label, field_type, is_required, sort_order) VALUES
                                                                                                             ('RAPPORT_M', 'date_reception', 'Date de réception', 'date', true, 1),
                                                                                                             ('RAPPORT_M', 'date_envoi', 'Date d''envoi', 'date', true, 2),
                                                                                                             ('RAPPORT_M', 'references', 'Références', 'text', true, 3),
                                                                                                             ('RAPPORT_M', 'detail', 'Détail', 'textarea', false, 4),
                                                                                                             ('RAPPORT_M', 'categorie', 'Catégorie', 'select', true, 5),
                                                                                                             ('RAPPORT_M', 'objet', 'Objet', 'text', true, 6),
                                                                                                             ('RAPPORT_M', 'matricule', 'Matricule ACT', 'text', true, 7),
                                                                                                             ('RAPPORT_M', 'nom_act', 'Nom et Prénom ACT', 'text', true, 8),
                                                                                                             ('RAPPORT_M', 'antenne', 'Antenne', 'text', true, 9),
                                                                                                             ('RAPPORT_M', 'num_train', 'N° de Train', 'text', true, 10),
                                                                                                             ('RAPPORT_M', 'date_train', 'Date du Train', 'date', true, 11),
                                                                                                             ('RAPPORT_M', 'gamme', 'Gamme', 'text', false, 12),
                                                                                                             ('RAPPORT_M', 'section', 'Section', 'text', false, 13);

-- LETTRE_SOMMATION_BILLET fields
INSERT INTO form_field_schemas (form_type, field_name, field_label, field_type, is_required, sort_order) VALUES
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'section', 'Section', 'text', false, 1),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'nom_prenom', 'Nom et Prénom', 'text', true, 2),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'antenne', 'Antenne', 'text', true, 3),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'matricule', 'Matricule', 'text', true, 4),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'num_dossier', 'N° de Dossier', 'text', true, 5),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'num_cine', 'N° CINE', 'text', true, 6),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'nom_act', 'Nom ACT', 'text', true, 7),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'gare_arrivee', 'Gare d''arrivée', 'text', false, 8),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'gare_depart', 'Gare de départ', 'text', true, 9),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'num_train', 'N° de Train', 'text', true, 10),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'date_voyage', 'Date de voyage', 'date', true, 11),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'montant', 'Montant infraction', 'number', true, 12),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'motif', 'Motif infraction', 'text', true, 13),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'gamme', 'Gamme', 'text', false, 14),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'statut', 'Statut', 'text', true, 15),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'num_pp', 'N° PP régularisation', 'text', false, 16),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'montant_regle', 'Montant réglé', 'number', false, 17),
                                                                                                             ('LETTRE_SOMMATION_BILLET', 'gare_reglement', 'Gare de règlement', 'text', false, 18);

-- LETTRE_SOMMATION_CARTE fields
INSERT INTO form_field_schemas (form_type, field_name, field_label, field_type, is_required, sort_order) VALUES
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'section', 'Section', 'text', false, 1),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'nom_prenom', 'Nom et Prénom', 'text', true, 2),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'num_dossier', 'N° de Dossier', 'text', true, 3),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'num_cine', 'N° CINE', 'text', true, 4),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'antenne', 'Antenne', 'text', true, 5),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'matricule', 'Matricule', 'text', true, 6),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'nom_act', 'Nom ACT', 'text', true, 7),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'num_carte', 'N° de la Carte', 'text', true, 8),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'parcours_de', 'Parcours De', 'text', true, 9),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'parcours_a', 'Parcours À', 'text', true, 10),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'categorie_carte', 'Catégorie carte', 'text', true, 11),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'date_validite', 'Date fin validité', 'date', true, 12),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'gamme', 'Gamme', 'text', false, 13),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'num_train', 'N° de Train', 'text', true, 14),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'date_voyage', 'Date de voyage', 'date', true, 15),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'montant', 'Montant infraction', 'number', true, 16),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'nb_jours_expiration', 'Nb jours expiration', 'number', false, 17),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'statut', 'Statut', 'text', true, 18),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'gare_reglement', 'Gare de règlement', 'text', false, 19),
                                                                                                             ('LETTRE_SOMMATION_CARTE', 'num_pp', 'N° PP régularisation', 'text', false, 20);