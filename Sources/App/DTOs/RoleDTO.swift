//
//  RoleDTO.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 25/02/2025.
//

import Fluent
import Vapor

struct RoleDTO: Content {
    var id: UUID?
    var roleName: String
    
    func toModel() -> Role {
        .init(
            id: id,
            roleName: roleName
        )
    }
}
