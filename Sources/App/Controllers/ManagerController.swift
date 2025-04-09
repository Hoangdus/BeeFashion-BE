//
//  ManagerController.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 26/02/2025.
//

import Vapor
import Fluent
import FluentMongoDriver

struct ManagerController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let managers = routes.grouped("managers")
        let manageRoute = routes.grouped("admin", "managers")
        
        managers.get(use: self.index)
        
        manageRoute.get(use: self.getAll)
        manageRoute.group(":id") { manager in
            manager.patch(use: self.restore)
            manager.delete(use: self.delete)
        }
        
    }
    
    @Sendable
    func index(req: Request) async throws -> [ManagerDTO] {
        try await Manager.query(on: req.db).all().map { $0.toDTO() }
    }
    
    @Sendable
    func getAll(req: Request) async throws -> [ManagerDTO] {
        try await Manager.query(on: req.db).withDeleted().all().map { $0.toDTO() }
    }
    
    @Sendable
    func update(req: Request) async throws -> ManagerDTO {
        guard let id: UUID = req.parameters.get("id") else {
            throw Abort(.badRequest)
        }
        
        guard let manager = try await Manager.find(id, on: req.db) else {
            throw Abort(.notFound)
        }
        
        let updateData = try req.content.decode(ManagerDTO.self)
        
        manager.email = updateData.email ?? manager.email
        manager.name = updateData.name ?? manager.name
        manager.phone = updateData.phone ?? manager.phone
        manager.roleID = updateData.role_id ?? manager.roleID
        
        try await manager.save(on: req.db)
        return manager.toDTO()
    }
    
    @Sendable
    func restore(req: Request) async throws -> HTTPStatus {
        guard let id: UUID = req.parameters.get("id") else { throw Abort(.badRequest) }
        guard let manager = try await Manager.query(on: req.db).withDeleted().filter(\.$id == id).first() else {
            throw Abort(.notFound)
        }

        try await manager.restore(on: req.db)
        return .noContent
    }
    
    @Sendable
    func delete(req: Request) async throws -> HTTPStatus {
        guard let manager = try await Manager.find(req.parameters.get("id"), on: req.db) else {
            throw Abort(.notFound)
        }

        try await manager.delete(on: req.db)
        return .noContent
    }
}
