//
//  SizeController.swift
//
//
//  Created by HoangDus on 20/02/2025.
//

import Fluent
import Vapor

struct SizeController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let sizes = routes.grouped("sizes")

        sizes.get(use: self.index)
        sizes.post(use: self.create)
        sizes.group(":sizeID") { size in
            size.delete(use: self.delete)
        }
    }

    @Sendable
    func index(req: Request) async throws -> [SizeDTO] {
        try await Size.query(on: req.db).all().map { $0.toDTO() }
    }

    @Sendable
    func create(req: Request) async throws -> SizeDTO {
        let size = try req.content.decode(SizeDTO.self).toModel()

        try await size.save(on: req.db)
        return size.toDTO()
    }

    @Sendable
    func delete(req: Request) async throws -> HTTPStatus {
        guard let size = try await Size.find(req.parameters.get("sizeID"), on: req.db) else {
            throw Abort(.notFound)
        }

        try await size.delete(on: req.db)
        return .noContent
    }
}

