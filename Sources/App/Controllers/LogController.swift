//
//  LogController.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 29/04/2025.
//

import Vapor
import Fluent
import FluentMongoDriver

struct LogController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let manageRoute = routes.grouped("admin", "logs")
        
        manageRoute.get(use: getAllLogs)
        manageRoute.post(use: create)
        
    }
    
    @Sendable
        func getAllLogs(req: Request) async throws -> [LogDTO] {
            var query = Log.query(on: req.db)
            
            if let contentType: String = try? req.query.get(String.self, at: "contentType"),
               let validContentType = ContentType(rawValue: contentType) {
                query = query.filter(\.$contentType == validContentType)
            }
            
            return try await query.all().map { $0.toDTO() }
        }
    
    @Sendable
    func create(req: Request) async throws -> LogDTO {
        let log = try req.content.decode(LogDTO.self).toModel()
        try await log.save(on: req.db)
        return log.toDTO()
    }
}
