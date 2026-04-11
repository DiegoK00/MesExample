using Api.DTOs.Programs;
using Api.Models;
using Api.Models.Enums;
using Api.Services;
using Api.Tests.Helpers;

namespace Api.Tests.Services;

public class ProgramServiceTests
{
    private static (ProgramService service, Api.Data.AppDbContext db) Build(string dbName)
    {
        var db = DbContextFactory.CreateWithSeed(dbName);
        var auditLog = new AuditLogService(db);
        return (new ProgramService(db, auditLog), db);
    }

    private static async Task<AppProgram> AddProgram(Api.Data.AppDbContext db, string code = "GESTIONE_ORDINI", bool isActive = true)
    {
        var program = new AppProgram
        {
            Code = code,
            Name = "Test Program",
            Description = "Desc",
            IsActive = isActive,
            CreatedAt = DateTime.UtcNow
        };
        db.Programs.Add(program);
        await db.SaveChangesAsync();
        return program;
    }

    // --- GetAllAsync ---

    [Fact]
    public async Task GetAllAsync_ReturnsAllPrograms()
    {
        var (service, db) = Build(nameof(GetAllAsync_ReturnsAllPrograms));
        await AddProgram(db, "PROG_A");
        await AddProgram(db, "PROG_B", isActive: false);

        var result = await service.GetAllAsync();

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetAllAsync_ActiveOnly_ReturnsOnlyActivePrograms()
    {
        var (service, db) = Build(nameof(GetAllAsync_ActiveOnly_ReturnsOnlyActivePrograms));
        await AddProgram(db, "ACTIVE");
        await AddProgram(db, "INACTIVE", isActive: false);

        var result = await service.GetAllAsync(activeOnly: true);

        Assert.Single(result);
        Assert.Equal("ACTIVE", result[0].Code);
    }

    // --- GetByIdAsync ---

    [Fact]
    public async Task GetByIdAsync_ExistingProgram_ReturnsProgram()
    {
        var (service, db) = Build(nameof(GetByIdAsync_ExistingProgram_ReturnsProgram));
        var program = await AddProgram(db);

        var result = await service.GetByIdAsync(program.Id);

        Assert.NotNull(result);
        Assert.Equal("GESTIONE_ORDINI", result.Code);
    }

    [Fact]
    public async Task GetByIdAsync_NonExisting_ReturnsNull()
    {
        var (service, _) = Build(nameof(GetByIdAsync_NonExisting_ReturnsNull));

        var result = await service.GetByIdAsync(999);

        Assert.Null(result);
    }

    // --- CreateAsync ---

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesProgram()
    {
        var (service, _) = Build(nameof(CreateAsync_ValidRequest_CreatesProgram));

        var (program, error) = await service.CreateAsync(new CreateProgramRequest
        {
            Code = "NUOVO_MODULO",
            Name = "Nuovo Modulo",
            Description = "Descrizione"
        });

        Assert.Null(error);
        Assert.NotNull(program);
        Assert.Equal("NUOVO_MODULO", program.Code);
        Assert.True(program.IsActive);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_DuplicateCode_ReturnsError));
        await AddProgram(db, "GESTIONE_ORDINI");

        var (program, error) = await service.CreateAsync(new CreateProgramRequest
        {
            Code = "GESTIONE_ORDINI",
            Name = "Altro"
        });

        Assert.Null(program);
        Assert.Contains("GESTIONE_ORDINI", error);
    }

    // --- UpdateAsync ---

    [Fact]
    public async Task UpdateAsync_ValidRequest_UpdatesProgram()
    {
        var (service, db) = Build(nameof(UpdateAsync_ValidRequest_UpdatesProgram));
        var program = await AddProgram(db);

        var (updated, error) = await service.UpdateAsync(program.Id, new UpdateProgramRequest
        {
            Name = "Nome Aggiornato",
            Description = "Nuova desc",
            IsActive = false
        });

        Assert.Null(error);
        Assert.NotNull(updated);
        Assert.Equal("Nome Aggiornato", updated.Name);
        Assert.False(updated.IsActive);
    }

    [Fact]
    public async Task UpdateAsync_NonExisting_ReturnsNulls()
    {
        var (service, _) = Build(nameof(UpdateAsync_NonExisting_ReturnsNulls));

        var (program, error) = await service.UpdateAsync(999, new UpdateProgramRequest
        {
            Name = "X",
            IsActive = true
        });

        Assert.Null(program);
        Assert.Null(error);
    }

    // --- DeleteAsync ---

    [Fact]
    public async Task DeleteAsync_ProgramWithNoUsers_DeletesAndReturnsTrue()
    {
        var (service, db) = Build(nameof(DeleteAsync_ProgramWithNoUsers_DeletesAndReturnsTrue));
        var program = await AddProgram(db);

        var result = await service.DeleteAsync(program.Id);

        Assert.True(result);
        Assert.Null(await service.GetByIdAsync(program.Id));
    }

    [Fact]
    public async Task DeleteAsync_NonExisting_ReturnsFalse()
    {
        var (service, _) = Build(nameof(DeleteAsync_NonExisting_ReturnsFalse));

        var result = await service.DeleteAsync(999);

        Assert.False(result);
    }

    [Fact]
    public async Task DeleteAsync_ProgramAssignedToUser_ThrowsInvalidOperation()
    {
        var (service, db) = Build(nameof(DeleteAsync_ProgramAssignedToUser_ThrowsInvalidOperation));
        var program = await AddProgram(db);

        db.UserPrograms.Add(new UserProgram
        {
            UserId = 1,
            ProgramId = program.Id,
            GrantedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.DeleteAsync(program.Id));
    }

    // --- AssignProgramsAsync ---

    [Fact]
    public async Task AssignProgramsAsync_ValidRequest_AssignsPrograms()
    {
        var (service, db) = Build(nameof(AssignProgramsAsync_ValidRequest_AssignsPrograms));
        var program = await AddProgram(db);

        var (success, error) = await service.AssignProgramsAsync(
            userId: 1,
            new AssignProgramRequest { ProgramIds = [program.Id] },
            grantedByUserId: 1);

        Assert.True(success);
        Assert.Null(error);

        var assigned = await service.GetUserProgramsAsync(1);
        Assert.Single(assigned);
        Assert.Equal(program.Code, assigned[0].Code);
    }

    [Fact]
    public async Task AssignProgramsAsync_NonExistingUser_ReturnsFalse()
    {
        var (service, db) = Build(nameof(AssignProgramsAsync_NonExistingUser_ReturnsFalse));
        var program = await AddProgram(db);

        var (success, error) = await service.AssignProgramsAsync(
            userId: 999,
            new AssignProgramRequest { ProgramIds = [program.Id] },
            grantedByUserId: 1);

        Assert.False(success);
        Assert.Null(error);
    }

    [Fact]
    public async Task AssignProgramsAsync_InactiveProgramId_ReturnsError()
    {
        var (service, db) = Build(nameof(AssignProgramsAsync_InactiveProgramId_ReturnsError));
        var program = await AddProgram(db, isActive: false);

        var (success, error) = await service.AssignProgramsAsync(
            userId: 1,
            new AssignProgramRequest { ProgramIds = [program.Id] },
            grantedByUserId: 1);

        Assert.False(success);
        Assert.NotNull(error);
    }

    [Fact]
    public async Task AssignProgramsAsync_AlreadyAssigned_DoesNotDuplicate()
    {
        var (service, db) = Build(nameof(AssignProgramsAsync_AlreadyAssigned_DoesNotDuplicate));
        var program = await AddProgram(db);

        await service.AssignProgramsAsync(1, new AssignProgramRequest { ProgramIds = [program.Id] }, 1);
        await service.AssignProgramsAsync(1, new AssignProgramRequest { ProgramIds = [program.Id] }, 1);

        var assigned = await service.GetUserProgramsAsync(1);
        Assert.Single(assigned); // non duplicato
    }

    // --- RevokeProgramsAsync ---

    [Fact]
    public async Task RevokeProgramsAsync_ValidRequest_RevokesPrograms()
    {
        var (service, db) = Build(nameof(RevokeProgramsAsync_ValidRequest_RevokesPrograms));
        var program = await AddProgram(db);
        await service.AssignProgramsAsync(1, new AssignProgramRequest { ProgramIds = [program.Id] }, 1);

        var (success, error) = await service.RevokeProgramsAsync(
            userId: 1,
            new AssignProgramRequest { ProgramIds = [program.Id] });

        Assert.True(success);
        Assert.Null(error);

        var remaining = await service.GetUserProgramsAsync(1);
        Assert.Empty(remaining);
    }

    [Fact]
    public async Task RevokeProgramsAsync_NonExistingUser_ReturnsFalse()
    {
        var (service, db) = Build(nameof(RevokeProgramsAsync_NonExistingUser_ReturnsFalse));
        var program = await AddProgram(db);

        var (success, _) = await service.RevokeProgramsAsync(
            userId: 999,
            new AssignProgramRequest { ProgramIds = [program.Id] });

        Assert.False(success);
    }
}
