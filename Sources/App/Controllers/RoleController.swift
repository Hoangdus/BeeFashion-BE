//
//  RoleController.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 25/02/2025.
//

import Vapor
import Fluent
import FluentMongoDriver

struct RoleController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let roleRoutes = routes.grouped("roles")
        roleRoutes.post(use: createRole)
    
    }
    
    @Sendable
    func createRole(req: Request) async throws -> RoleDTO {
        let roleDTO = try req.content.decode(RoleDTO.self)
        let role = roleDTO.toModel()
        
        do {
            try await role.save(on: req.db)
            
            return RoleDTO(id: role.id, roleName: role.roleName)
        } catch let error as DatabaseError where error.isConstraintFailure {
            throw Abort(.conflict, reason: "A role with this name already exists")
        }
    }
    
}
