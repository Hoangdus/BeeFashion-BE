//
//  BrandController.swift
//
//
//  Created by HoangDus on 20/02/2025.
//

import Fluent
import Vapor

struct BrandController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let brands = routes.grouped("brands")

        brands.get(use: self.index)
        brands.post(use: self.create)
        brands.group(":brandID") { brand in
            brand.delete(use: self.delete)
        }
    }

    @Sendable
    func index(req: Request) async throws -> [BrandDTO] {
        try await Brand.query(on: req.db).all().map { $0.toDTO() }
    }

    @Sendable
    func create(req: Request) async throws -> BrandDTO {
        let brand = try req.content.decode(BrandDTO.self).toModel()

        try await brand.save(on: req.db)
        return brand.toDTO()
    }

    @Sendable
    func delete(req: Request) async throws -> HTTPStatus {
        guard let brand = try await Brand.find(req.parameters.get("brandID"), on: req.db) else {
            throw Abort(.notFound)
        }

        try await brand.delete(on: req.db)
        return .noContent
    }
}
