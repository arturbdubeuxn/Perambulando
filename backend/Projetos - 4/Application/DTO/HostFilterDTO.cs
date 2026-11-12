using System.ComponentModel.DataAnnotations;
﻿using Projetos___4.Domain.Model;

namespace Projetos___4.Application.DTO
{
    public class HostFilterDTO
    {
        public string? Name { get; set; }

        public List<Hosts.TypeofHost>? Types { get; set; }

        public string? City { get; set; }

        public bool? HasProgrammings { get; set; }

        [Range(typeof(decimal), "0", "79228162514264337593543950335")]
        public decimal? MinPrice { get; set; }

        [Range(typeof(decimal), "0", "79228162514264337593543950335")]
        public decimal? MaxPrice { get; set; }

        [EnumDataType(typeof(DayOfWeek))]
        public DayOfWeek? DayOfWeek { get; set; }

        public TimeOnly? StartTime { get; set; }

        public TimeOnly? EndTime { get; set; }

        public bool EndsNextDay { get; set; }

        [Range(1, 100)]
        public int Take { get; set; } = 10;

        [Range(0, int.MaxValue)]
        public int Skip { get; set; } = 0;
    }
}
