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
		let manageSizes = routes.grouped("admin", "sizes")
		
        sizes.get(use: self.index)
		
		manageSizes.get(use: self.getAll)
        manageSizes.post(use: self.create)
		manageSizes.group(":sizeID") { size in
			size.patch(use: self.restore)
            size.delete(use: self.delete)
        }
    }

    @Sendable
    func index(req: Request) async throws -> [SizeDTO] {
        try await Size.query(on: req.db).all().map { $0.toDTO() }
    }
	
	@Sendable
	func getAll(req: Request) async throws -> [SizeDTO] {
		try await Size.query(on: req.db).withDeleted().all().map { $0.toDTO() }
	}

    @Sendable
    func create(req: Request) async throws -> SizeDTO {
        let size = try req.content.decode(SizeDTO.self).toModel()

        try await size.save(on: req.db)
        return size.toDTO()
    }

	@Sendable
	func restore(req: Request) async throws -> HTTPStatus {
		guard let sizeID: UUID = req.parameters.get("sizeID") else { throw Abort(.badRequest) }
		guard let size = try await Size.query(on: req.db).withDeleted().filter(\.$id == sizeID).first() else {
			throw Abort(.notFound)
		}

		try await size.restore(on: req.db)
		return .noContent
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

