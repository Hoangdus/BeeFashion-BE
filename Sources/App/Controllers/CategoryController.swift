//
//  CategoryController.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import Vapor

struct CategoryController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let categories = routes.grouped("categories")

        categories.get(use: self.index)
        categories.post(use: self.create)
        categories.group(":categoryID") { category in
            category.delete(use: self.delete)
        }
    }

    @Sendable
    func index(req: Request) async throws -> [CategoryDTO] {
        try await Category.query(on: req.db).all().map { $0.toDTO() }
    }

    @Sendable
    func create(req: Request) async throws -> CategoryDTO {
        let category = try req.content.decode(CategoryDTO.self).toModel()

        try await category.save(on: req.db)
        return category.toDTO()
    }

    @Sendable
    func delete(req: Request) async throws -> HTTPStatus {
        guard let category = try await Category.find(req.parameters.get("categoryID"), on: req.db) else {
            throw Abort(.notFound)
        }

        try await category.delete(on: req.db)
        return .noContent
    }
}
