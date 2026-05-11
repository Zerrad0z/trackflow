package com.trackflow.module.form.dto;

import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.entity.FormField;
import com.trackflow.module.user.dto.UserMapper;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface FormMapper {
    FormResponse toResponse(Form form);
    FormFieldResponse toFieldResponse(FormField formField);
}
